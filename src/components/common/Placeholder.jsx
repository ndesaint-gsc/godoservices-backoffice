import { Box, Typography } from '@mui/material';

const Placeholder = ({ title, note }) => (
  <Box>
    <Typography variant="overline" color="text.secondary">
      En construcción
    </Typography>
    <Typography variant="h4">{title}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
      {note || 'Esta sección se está migrando del backoffice antiguo.'}
    </Typography>
  </Box>
);

export default Placeholder;
