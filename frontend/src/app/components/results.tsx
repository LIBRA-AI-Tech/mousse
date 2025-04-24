import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Chip, Grid2, List, ListItem, ListItemText, Pagination, Typography } from "@mui/material";
import { RootState, useAppDispatch } from "../store";
import { setHoveredFeature } from "../../features/map/mapSlice";
import { fetchRecords, resetSearch, setCurrentPage, setThresholdFlag } from "../../features/search/searchSlice";
import { Link } from "@mui/material";

export default function Results() {
  const dispatch = useAppDispatch();
  const navigateTo = useNavigate();

  const { data, page, hasMore } = useSelector((state: RootState) => state.search.records);
  const { status, currentPage, pageCount, filterValues, query, features, usedLowerThreshold } = useSelector((state: RootState) => state.search);
  const { clusteredMode } = useSelector((state: RootState) => state.ui);
  const { hoveredFeature } = useSelector((state: RootState) => state.map);

  const listItemRefs = useRef<{ [key: string]: HTMLLIElement | null }>({});

  const truncateText = (text: string): string => {
    if (!text) return '';
    const words = text.split(' ').filter(w => w.trim().length > 0);
    const finalText = words.length > 15 ? words.slice(0, 15).join(' ') + "…" : text;

    return finalText;
  };

  const handleLowerThreshold = () => {
    dispatch(setThresholdFlag(true));

    const { startDate, endDate, phase, ...otherFilters } = filterValues;
    const filters = {
      ...otherFilters,
      country: otherFilters.country.map((c) => c.code),
      dateRange: {
        start: startDate?.toISOString().substring(0, 10),
        end: endDate?.toISOString().substring(0, 10),
      },
      epoch: phase.map((p) => p.value),
    };

    dispatch(resetSearch());

    dispatch(fetchRecords({
      query,
      page: 1,
      features,
      threshold: 0.4,
      output: 'geojson',
      ...filters,
    }));
  };

  useEffect(() => {
    if (hoveredFeature && listItemRefs.current[hoveredFeature]) {
      listItemRefs.current[hoveredFeature]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [hoveredFeature]);


  if (!data && (status !== 'pending' && status !== 'loading')) {
    return <List>
      <ListItem>
        <Alert severity="info" sx={{width: '100%'}}>Please select a cluster</Alert>
      </ListItem>
    </List>
  }

  return (
    <>
      <List sx={(status === 'loading' || status === 'pending') ? {opacity: 0.5, pointerEvents: 'none'} : {}}>
        {data?.features.map((f) => (
          <ListItem
            key={`feature-${f.id}`}
            ref={(el) => (listItemRefs.current[f.id || ''] = el)}
            sx={{
              backgroundColor: hoveredFeature === f.id ? "rgba(255,236,190,0.3)" : undefined,
              borderBottom: '1px solid rgba(150, 150, 150, 0.2)',
              cursor: 'pointer'
            }}
            onClick={() => dispatch(setHoveredFeature(f.id || null))}
          >
            <ListItemText
              secondary={hoveredFeature === f.id ?
                <Grid2 component="span" container sx={{wordBreak: 'break-word'}}>
                  <Grid2 component="span" size={10} sx={{textAlign: 'justify'}}>
                    {f.properties?.description}
                  </Grid2>
                  <Grid2 component="span" size={2} sx={{textAlign: 'right'}}>
                    <Button color="warning" onClick={() => navigateTo(`/r/${f.id}`)}>See More</Button>
                  </Grid2>
                  {f.properties?.keyword && (
                    <Grid2 component="span" size={10} sx={{mt: 1}}>
                      <b>Keywords:</b> {f.properties.keyword.join('; ')}
                    </Grid2>
                  )}
                </Grid2>
                :
                truncateText(f.properties?.description)}
            >
              <Typography component="div" sx={{textAlign: 'right'}}>
                {f.properties?.topic.filter((topic: string | null) => topic !== null).map((topic: string, index: number) => (
                  <Chip key={`chip_${f.id}_${index}`} component="span" label={topic} size="small" />
                ))}
              </Typography>
              <Typography sx={{textAlign: 'left'}}>{f.properties?.title}</Typography>
            </ListItemText>
          </ListItem>
        ))}
        {(page === 1 && !hasMore && (clusteredMode ? true : !usedLowerThreshold)) && (
          <ListItem sx={{marginBlock: '1rem 2rem'}}>
            <Typography variant='body2' sx={{fontStyle: 'italic'}}>
              We can not find many relevant results to your query and filters. If you like,{" "}
              <Link
                component='span'
                variant='body2'
                onClick={handleLowerThreshold}
                sx={{cursor: 'pointer'}}
                >
                you can repeat the search with a relaxed threshold
              </Link>.
            </Typography>
          </ListItem>
        )}
      </List>
      {(data.features.length === 0 && (clusteredMode ? true : usedLowerThreshold)) && (<Typography sx={{textAlign: 'center', m: 4}}>No results.</Typography>)}
      {data.features.length > 0 && (
        <Pagination
          disabled={status !== 'succeeded'}
          count={pageCount}
          showFirstButton={true}
          showLastButton={false}
          hidePrevButton={false}
          hideNextButton={false}
          size="small"
          sx={{pb: 2, display: 'flex', justifyContent: 'center'}}
          page={currentPage}
          onChange={(_, page) => dispatch(setCurrentPage(page))}
        />
      )}
    </>
  );
}
