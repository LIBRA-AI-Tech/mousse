import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button, Chip, Grid2, List, ListItem, ListItemText, Pagination, Paper, Typography } from "@mui/material";
import { RootState, useAppDispatch } from "../store";
import { setHoveredFeature } from "../../features/map/mapSlice";
import { setCurrentPage } from "../../features/search/searchSlice";

export default function Results() {
  const dispatch = useAppDispatch();
  const navigateTo = useNavigate();

  const { data } = useSelector((state: RootState) => state.search.records);
  const { status, currentPage, pageCount } = useSelector((state: RootState) => state.search);
  const { hoveredFeature } = useSelector((state: RootState) => state.map);

  const listItemRefs = useRef<{ [key: string]: HTMLLIElement | null }>({});

  const truncateText = (text: string): string => {
    if (!text) return '';
    const words = text.split(' ').filter(w => w.trim().length > 0);
    const finalText = words.length > 15 ? words.slice(0, 15).join(' ') + "…" : text;

    return finalText;
  };

  useEffect(() => {
    if (hoveredFeature && listItemRefs.current[hoveredFeature]) {
      listItemRefs.current[hoveredFeature]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [hoveredFeature]);

  if (!data)
    return null;

  return (
    <Paper sx={{height: 'calc(100vh - 100px)', maxHeight: 'calc(100vh - 100px)', overflow: 'auto'}}>
      <List sx={(status === 'loading' || status === 'pending') ? {opacity: 0.5, pointerEvents: 'none'} : {}}>
        <Typography variant="h6" sx={{mx: 2}} color="textSecondary">Results</Typography>
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
      </List>
      { data.features.length === 0 ?
        <Typography sx={{textAlign: 'center', m: 4}}>No results.</Typography>
        :
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
      }
    </Paper>
  );
}
