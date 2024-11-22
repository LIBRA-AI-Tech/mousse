import { AppBar, Toolbar, Box } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Search from "./search";
import { useAppDispatch } from '../store';
import { toggleInfoModal } from '../../features/ui/uiSlice';

function Bar() {
  const dispatch = useAppDispatch();
  return (
    <Box sx={{ flexGrow: 1, height: "70px", paddingBottom: "10px" }}>
      <AppBar color='transparent' sx={{margin: "5px 0 5px 5px", padding: "5px 0 5px 5px"}}>
        <Toolbar sx={{display: "flex", justifyContent: "space-between", }}>
          <img src="/logo.png" alt="mousse logo" height={'50px'}/>
          <Search />
          <HelpOutlineIcon
            role="button"
            color="primary"
            sx={{
              height: "inherit",
              fontSize: '2em',
              ":hover": {color: "#bfb48c", cursor: "pointer"}
            }}
            onClick={() => {
              dispatch(toggleInfoModal(true));
            }}
          />
        </Toolbar>
      </AppBar>
    </Box>
  );
}

export default Bar;
