import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { Box, InputBase, InputBaseComponentProps, styled, SxProps } from "@mui/material";

type styledContent = {
  start: number,
  end: number,
  style: CSSProperties,
}

interface StyledInputProps {
  sx?: SxProps;
  placeholder?: string;
  onFocus?: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  inputProps?: InputBaseComponentProps;
  value: string;
  onChange: (value: string) => void;
  applyStyling?: (value: string) => styledContent[];
}

const StyledContentEditableWrapper = styled(Box)(({theme}) => ({
  width: '100%',
  maxWidth: '100%',
  display: 'flex',
  alignItems: 'center',
  padding: '8px 12px',
  border: '1px solid',
  borderColor: theme.palette.divider,
  borderRadius: theme.shape.borderRadius,
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.body1.fontSize,
  lineHeight: theme.typography.body1.lineHeight,
  transition: theme.transitions.create(['border-color', 'box-shadow']),
  borderWidth: 0,
  position: 'relative',
}));

const StyledContentEditable = styled('div')(() => ({
  flex: 1,
  outline: 'none',
  whiteSpace: 'pre',
  wordWrap: 'break-word',
  minHeight: '1em',
  cursor: 'text',
  overflowX: 'hidden',
  width: '100%',
  pointerEvents: 'none',
  backgroundColor: 'rgba(255,255,255,0)',
  zIndex: 100,
  position: 'absolute',
}));

const StyledInput = (props: StyledInputProps) => {
  const { sx, value, onChange, applyStyling, ...otherProps } = props;
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const currentInputRef = useRef<HTMLInputElement | null>(null);
  const [text, setText] = useState<string>(value);
  const [styledText, setStyledText] = useState<styledContent[]|null>(applyStyling ? applyStyling(value) : null);

  const inputRef = otherProps.inputRef ?? currentInputRef;

  const syncWidth = useCallback(() => {
    if (inputRef.current && overlayRef.current) {
      const inputWidth = inputRef.current.clientWidth;
      overlayRef.current.style.width = `${inputWidth}px`;
    }
  }, [inputRef]);

  const syncScroll = useCallback(() => {
    if (inputRef.current && overlayRef.current) {
      overlayRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  }, [inputRef]);

  const totalInputSync = useCallback(() => {
    syncWidth();
    syncScroll();
  }, [syncWidth, syncScroll]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setText(value);
    if (onChange) {
      onChange(value);
    }
    syncScroll();
  };

  useEffect(() => {
    syncWidth();
    window.addEventListener('resize', totalInputSync);
    return () => {
      window.removeEventListener('resize', totalInputSync);
    }
  }, [syncWidth, totalInputSync]);

  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => {
    if (applyStyling) {
      const fetchStyledText = async () =>{
        const currentStyledText = await applyStyling(text);
        setStyledText(currentStyledText);
      }
      fetchStyledText();
    }
  }, [applyStyling, text]);

  return (
    <StyledContentEditableWrapper sx={sx}>
      <StyledContentEditable
        ref={overlayRef}
      >
        {!styledText ? text : styledText.map(({start, end, style}, index) => {
          return (
            <span key={`span_${index}`} style={style}>{text.substring(start, end)}</span>
          );
      })}
      </StyledContentEditable>
      <InputBase
        sx={{
          flex: 1,
          width: '100%',
          color: text === '' ? 'inherit' : 'transparent',
          caretColor: 'black',
          position: 'relative',
          zIndex: 1000,
          letterSpacing: 'normal',
          overflow: 'auto',
        }}
        onChange={handleInputChange}
        value={text}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        data-gramm="false"
        {...otherProps}
        inputRef={inputRef}
      />
    </StyledContentEditableWrapper>
  );

}

export default StyledInput;
