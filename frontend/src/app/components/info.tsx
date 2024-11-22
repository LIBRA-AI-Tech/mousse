import { useSelector } from 'react-redux';
import { Fade, Dialog, DialogContent, DialogTitle, DialogContentText, IconButton, List, ListItem, Grid2 } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import GitHubIcon from '@mui/icons-material/GitHub';
import BugReportIcon from '@mui/icons-material/BugReport';
import { RootState, useAppDispatch } from '../store';
import { toggleInfoModal } from '../../features/ui/uiSlice';

const Info = () => {
  const dispatch = useAppDispatch();
  const { isInfoModalOpen } = useSelector((state: RootState) => state.ui);

  const handleClose = () => {
    dispatch(toggleInfoModal(false));
  }

  return (
    <Dialog open={isInfoModalOpen} onClose={handleClose} sx={{borderRadius: 20}}>
      <Fade in={isInfoModalOpen}>
        <div>
          <DialogTitle sx={{ m: 0, pr: 20 }}>Support & Feedback</DialogTitle>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={(theme) => ({
              position: 'absolute',
              right: 10,
              top: 10,
              color: theme.palette.grey[500],
            })}
          >
            <CloseIcon />
          </IconButton>
          <DialogContent>
            <DialogContentText sx={{fontWeight: 500}}>
              Official Mousse Resources
            </DialogContentText>
            <List>
              <Grid2 container spacing={2}>
                <Grid2 container direction="column">
                  <ListItem>
                    <InfoIcon sx={{pr: 1}} />
                    <a href="#"><DialogContentText>Documentation</DialogContentText></a>
                  </ListItem>
                  <ListItem>
                    <GitHubIcon sx={{pr: 1}} />
                    <a href="https://github.com/LIBRA-AI-Tech/mousse" target="_blank"><DialogContentText>Source</DialogContentText></a>
                  </ListItem>
                </Grid2>
                <Grid2 container direction="column">
                  <ListItem>
                    <BugReportIcon sx={{pr: 1}} />
                    <a href="https://github.com/LIBRA-AI-Tech/mousse/issues" target="_blank"><DialogContentText>Bugs & Feature Requests</DialogContentText></a>
                  </ListItem>
                </Grid2>
              </Grid2>
            </List>
          </DialogContent>
        </div>
      </Fade>
    </Dialog>
  );
};

export default Info;
