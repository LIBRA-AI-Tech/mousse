import json
import shapely
from sqlalchemy import text, TextClause

class SqlConstuctor():
    ctes = {
        'country': """
            SELECT record_uuid
            FROM core."location"
            WHERE ST_Intersects(
                geometry,
                (SELECT ST_Simplify(ST_Union(geometry), 0.1) FROM core.countries WHERE "code" IN (%(country_list)s))
            )
        """,
        'features': """
            SELECT record_uuid
            FROM core."location"
            WHERE ST_Intersects(geometry, ST_GeomFromText(%(wkt)s, 4326))
        """,
        'daterange': """
            SELECT record_uuid
            FROM core.record_time_range
            WHERE time_interval && tstzrange(%(start)s, %(end)s, '[]')
        """,
        'epoch': """
            SELECT record_uuid
            FROM (
                SELECT 
                    record_uuid,
                    CASE 
                        WHEN upper(time_interval) - lower(time_interval) >= '1 year'::interval THEN
                            ARRAY(select generate_series(1, 12))
                        ELSE
                            ARRAY(
                                SELECT EXTRACT(MONTH FROM d)::int
                                FROM generate_series(
                                    lower(time_interval)::date,
                                    upper(time_interval)::date,
                                    '1 month'
                                ) AS d
                            ) 
                    END AS "month"
                FROM core.record_time_range
            ) AS extracted_months
            WHERE array[%(month_list)s] && "month"
        """,
        'semantic': """
            SELECT emb.*
            FROM core.embedding emb
            WHERE emb.record_uuid IN (SELECT record_uuid FROM ensemble)
            ORDER BY emb.vector <=> %(embedding)s
            LIMIT 100
        """
    }

    def __init__(self):
        self.parameters = {}
        self.queries = {}
    
    def _part(self, topic: str, **kwargs) -> str:
        if topic not in self.ctes:
            raise ValueError()
        return self.ctes[topic] % kwargs
    
    def add(self, topic: str, *args, **kwargs) -> None:
        if topic == 'country':
            self._add_country_cte(*args, **kwargs)
        elif topic == 'spatial':
            self._add_spatial_cte(*args, **kwargs)
        elif topic == 'daterange':
            self._add_daterange_cte(*args, **kwargs)
        elif topic == 'epoch':
            self._add_epoch_cte(*args, **kwargs)
        else:
            raise ValueError()
    
    def _add_country_cte(self, country_list: list[str]) -> None:
        self.parameters.update({f"code_{i}": country for i, country in enumerate(country_list)})
        placeholders = ", ".join(f":code_{i}" for i in range(len(country_list)))
        self.queries.update({'country_filtered': self._part('country', country_list = placeholders)})

    def _add_spatial_cte(self, features: list) -> None:
        geojson = {
            "type": "FeatureCollection",
            "features": features,
        }
        geojson = json.dumps(geojson)
        wkt = shapely.to_wkt(shapely.union_all(shapely.from_geojson(geojson)))
        self.parameters.update({'wkt': wkt})
        self.queries.update({'spatially_filtered': self._part('features', wkt=":wkt")})

    def _add_daterange_cte(self, start_date: str, end_date: str) -> None:
        self.parameters.update({'start_date': start_date, 'end_date': end_date})
        self.queries.update({'date_filtered': self._part('daterange', start=':start_date', end=':end_date')})

    def _add_epoch_cte(self, months: list[str]) -> None:
        self.parameters.update({f"epoch_{i}": month for i, month in enumerate(months)})
        placeholders = ", ".join(f":epoch_{i}" for i in range(len(months)))
        self.queries.update({'epoch_filtered': self._part('epoch', month_list=placeholders)})

    def _add_ensemble_cte(self) -> None:
        if len(self.queries) == 0:
            return
        stmts = [f"SELECT record_uuid FROM {cte}" for cte in self.queries if cte not in ['ensemble', 'embedding']]
        self.queries.update({'ensemble': "\nINTERSECT\n".join(stmts)})

    def _add_embedding_cte(self, embedding: list) -> None:
        self.parameters.update({'embedding': embedding})
        self.queries.update({'vector_search': self._part('semantic', embedding=':embedding')})

    def create(self, embedding: list) -> TextClause:
        self._add_ensemble_cte()
        self._add_embedding_cte(embedding)
        ctes = ",\n".join([f"{name} AS ({stmt})" for name, stmt in self.queries.items()])
        stmt = f"""
            WITH {ctes}
            SELECT rec.*
            FROM vector_search emb
            JOIN core.record rec ON rec."uuid" = emb.record_uuid
        """.strip()
        return text(stmt).bindparams(**self.parameters)
