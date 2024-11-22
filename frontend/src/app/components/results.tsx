import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Button, Grid2, List, ListItem, ListItemText, Pagination, Paper, Typography } from "@mui/material";
import { RootState, useAppDispatch } from "../store";
import { setHoveredFeature } from "../../features/map/mapSlice";

export default function Results() {
  const dispatch = useAppDispatch();

  const { results } = useSelector((state: RootState) => state.search);
  const { hoveredFeature } = useSelector((state: RootState) => state.map);
  let activeTimeoutId: number|null = null;

  const listItemRefs = useRef<{ [key: string]: HTMLLIElement | null }>({});

  const handleMouseEnter = (id: string|number|undefined|null) => {
    if (!id && id !== null) return;
    activeTimeoutId = setTimeout(() => {
      dispatch(setHoveredFeature(id));
    }, 700);
  };

  const handleMouseLeave = () => {
    if (activeTimeoutId) {
      clearTimeout(activeTimeoutId);
    }
  }

  const truncateText = (text: string): string => {
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

  if (!results)
    return null;

  return (
    <Paper sx={{height: 'calc(100vh - 100px)', maxHeight: 'calc(100vh - 100px)', overflow: 'auto'}}>
      <List sx={{}}>
        {results?.features.map((f) => (
          <ListItem
            key={`feature-${f.id}`}
            ref={(el) => (listItemRefs.current[f.id || ''] = el)}
            sx={{
              backgroundColor: hoveredFeature === f.id ? "rgba(255,236,190,0.3)" : undefined,
              borderBottom: '1px solid rgba(150, 150, 150, 0.2)',
              cursor: 'pointer'
            }}
            onMouseEnter={() => handleMouseEnter(f.id)}
            onMouseLeave={() => handleMouseLeave()}
            onClick={() => dispatch(setHoveredFeature(f.id || null))}
          >
            <ListItemText
              secondary={hoveredFeature === f.id ?
                <Grid2 component="span" container sx={{textAlign: 'justify'}}>
                  <Grid2 component="span" size={10}>
                    {f.properties?.description}
                  </Grid2>
                  <Grid2 component="span" size={2}>
                    <Button color="warning">See More</Button>
                  </Grid2>
                </Grid2>
                :
                truncateText(f.properties?.description)}
            >
              <Typography sx={{textAlign: 'left'}}>{f.properties?.title}</Typography>
            </ListItemText>
          </ListItem>
        ))}
      </List>
      <Pagination
        count={10}
        showFirstButton
        showLastButton
        hidePrevButton
        hideNextButton
        size="small"
        sx={{pb: 2, display: 'flex', justifyContent: 'center'}}
      />
    </Paper>
  );
}
