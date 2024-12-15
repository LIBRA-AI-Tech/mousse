import { useSelector } from 'react-redux';
import { Dayjs } from 'dayjs';
import { Autocomplete, AutocompleteRenderInputParams, Box, Checkbox, Chip, FormControlLabel, Grid2, IconButton, TextField, Typography } from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from "@mui/x-date-pickers";
import FilterListOffOutlinedIcon from '@mui/icons-material/FilterListOffOutlined';
import SpringIcon from '@mui/icons-material/EmojiNatureOutlined';
import SummerIcon from '@mui/icons-material/WbSunnyOutlined';
import AutumnIcon from '@mui/icons-material/WbCloudyOutlined';
import WinterIcon from '@mui/icons-material/AcUnitOutlined';
import { RootState, useAppDispatch } from '../store';
import { toggleDrawOnMap } from '../../features/ui/uiSlice';
import { resetLayer } from '../../features/search/searchSlice';
import { CountryType, PhaseOptionType, FilterValuesType } from '../../types';

interface RenderOptionProps extends React.HTMLAttributes<HTMLLIElement> {
  key: string;
}

interface FilterBarProps {
  values: FilterValuesType;
  onChange: (params: {name: string, value: FilterValuesType['country']|FilterValuesType['phase']|Dayjs|null}) => void;
  onReset: () => void;
}

export default function FilterBar({values, onChange, onReset}: FilterBarProps) {

  const dispatch = useAppDispatch();
  const countryList: CountryType[] = useSelector((state: RootState) => state.countryList.data);
  const { isDrawOnMapActive } = useSelector((state: RootState) => state.ui);

  const handleDrawOnMapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    if (!checked) {
      dispatch(resetLayer());
    }
    dispatch(toggleDrawOnMap(checked));
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 80,
        left: 0,
        zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.8)',
        minWidth: '40vw',
        p: 2
      }}
    >
      <IconButton title="Reset Filters" sx={{position: 'absolute', right: 0, top: 1, mr: 3}} onClick={onReset}>
        <FilterListOffOutlinedIcon/>
      </IconButton>
      <Box component="fieldset" sx={{border: "none", pb: 3, mb: 3}}>
        <legend><Typography>LOCATION</Typography></legend>
        <Grid2 container spacing={0}>
          <Grid2 size={12} sx={{textAlign: "right", }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isDrawOnMapActive}
                  onChange={handleDrawOnMapChange}
                />
              } label="Draw on map"
            />
          </Grid2>
          <Grid2 size={12}>
            <Autocomplete
              multiple
              disabled={isDrawOnMapActive}
              id="country-filter"
              value={values.country}
              onChange={(_e, value) => onChange({name: 'country', value})}
              options={countryList}
              autoHighlight
              getOptionLabel={(option: CountryType) => option.label}
              renderOption={(props: RenderOptionProps, option: CountryType) => {
                const { key, ...optionProps } = props;
                return (
                  <Box
                    key={key}
                    component="li"
                    sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                    {...optionProps}
                  >
                    <img
                      loading="lazy"
                      width="20"
                      srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
                      src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
                      alt=""
                    />
                    {option.label} ({option.code})
                  </Box>
                );
              }}
              renderInput={(params: AutocompleteRenderInputParams) => (
                <TextField
                  {...params}
                  name="country"
                  label="Country"
                  slotProps={{
                    htmlInput: {
                      ...params.inputProps,
                      autoComplete: 'new-password', // disable autocomplete and autofill
                    },
                  }}
                  variant="standard"
                />
              )}
            />
          </Grid2>
        </Grid2>
      </Box>
      <Box component="fieldset" sx={{border: "none"}}>
      <legend><Typography sx={{mb: 1}}>PERIOD</Typography></legend>
        <Grid2 container spacing={10}>
          <Grid2 size={6}>
            <Grid2 container spacing={3}>
              <Grid2 size={12}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    sx={{width: '100%'}}
                    value={values.startDate}
                    name="start_date"
                    onChange={(value) => onChange({name: 'startDate', value})}
                    maxDate={values.endDate || undefined}
                    label="Start Date"
                    slotProps={{ textField: { variant: 'standard', } }}
                  />
                </LocalizationProvider>
              </Grid2>
              <Grid2 size={12}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      sx={{width: '100%'}}
                      value={values.endDate}
                      name="end_date"
                      onChange={(value) => onChange({name: 'endDate', value})}
                      minDate={values.startDate || undefined}
                      label="End Date"
                      slotProps={{ textField: { variant: 'standard', } }}
                    />
                  </LocalizationProvider>
                </Grid2>
              </Grid2>
          </Grid2>
          <Grid2 size={6} sx={{textAlign: 'right'}}>
            <Autocomplete
              multiple
              options={timePhaseOptions}
              groupBy={(option) => option.kind}
              renderOption={(props: RenderOptionProps, option) => {
                const { key, ...optionProps } = props;
                return (
                  <Box key={key} component="li" {...optionProps}>
                    <RenderIcon value={option.value} />
                    {option.kind === 'Month' ?  `${option.value}-${option.label}` : option.label}
                  </Box>
                );
              }}
              renderInput={(params: AutocompleteRenderInputParams) => (
                <TextField
                  {...params}
                  name="phase"
                  label="Phase"
                  slotProps={{ htmlInput: {...params.inputProps, autoComplete: 'new-password'} }}
                  variant="standard"
                />
              )}
              renderTags={(value, getTagsProps) => value.map((options, index) => {
                const { key, ...otherProps } = getTagsProps({index});
                return (
                  <Chip
                    key={key}
                    label={options.kind === 'Month' ? options.label.substring(0, 3) : options.label}
                    {...otherProps}
                  />
                )
              })}
              value={values.phase}
              onChange={(_e, value) => onChange({name: 'phase', value})}
            />
          </Grid2>
        </Grid2>
      </Box>
    </Box>
  );
}

const RenderIcon = ({ value }: { value: string}) => {
  const commonProps = {sx: {mr: 2}};
  switch (value) {
    case "winter":
      return <WinterIcon {...commonProps}/>

    case "spring":
      return <SpringIcon {...commonProps}/>

    case "summer":
      return <SummerIcon {...commonProps}/>

    case "autumn":
      return <AutumnIcon {...commonProps}/>;
  
    default:
      return null;
  }
}

const timePhaseOptions: PhaseOptionType[] = [
  {kind: "Season", value: "winter", label: "Winter"},
  {kind: "Season", value: "spring", label: "Spring"},
  {kind: "Season", value: "summer", label: "Summer"},
  {kind: "Season", value: "autumn", label: "Autumn"},
  {kind: "Month", value: "01", label: "January"},
  {kind: "Month", value: "02", label: "February"},
  {kind: "Month", value: "03", label: "March"},
  {kind: "Month", value: "04", label: "April"},
  {kind: "Month", value: "05", label: "May"},
  {kind: "Month", value: "06", label: "June"},
  {kind: "Month", value: "07", label: "July"},
  {kind: "Month", value: "08", label: "August"},
  {kind: "Month", value: "09", label: "September"},
  {kind: "Month", value: "10", label: "October"},
  {kind: "Month", value: "11", label: "November"},
  {kind: "Month", value: "12", label: "December"},
];
