import {Chip, Grid, IconButton, List, ListItem, ListItemText, Paper, Tooltip, Typography} from "@mui/material";
import {Box} from "@mui/system";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {Absence} from "./Absences";

interface AbsenceCardProps{
  absence: Absence;
  handleOpenDialog: (absence: Absence) => void;
  handleDeleteAbsence: (absenceId: number) => void;
};

export function AbsenceCard({absence, handleOpenDialog, handleDeleteAbsence} : AbsenceCardProps){

  const statusColors: Record<string, string> = {
    "pending": "warning",
    "accepted": "success",
    "completed": "info",
    "canceled": "error"
  };

  const statusLabels: Record<string, string> = {
    "pending": "En attente",
    "accepted": "Acceptée",
    "completed": "Terminée",
    "canceled": "Annulée"
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  return (
    <Grid item xs={12} md={6}>
      <Paper sx={{ p: 2, position: "relative" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6">
          Du {formatDate(absence.start_date)} au {formatDate(absence.end_date)}
          </Typography>
          <Chip
            label={statusLabels[absence.status] || absence.status} 
            color={statusColors[absence.status] as any || "default"}
            size="small"
          />
        </Box>
        
        <Typography variant="body1" sx={{ mt: 1 }}>
          {absence.notes || "Aucune note"}
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">
            Contacts de confiance ({absence.trusted_contacts.length}):
          </Typography>
          {absence.trusted_contacts.length > 0 ? (
            <List dense>
              {absence.trusted_contacts.map((contact) => (
                <ListItem key={contact.id} disableGutters>
                  <ListItemText 
                    primary={`${contact.firstname} ${contact.lastname}`}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Aucun contact de confiance sélectionné
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          {/* Possible d'éditer seulement si en attente ou acceptée */}
          {["pending", "accepted"].includes(absence.status) && (
            <IconButton onClick={() => handleOpenDialog(absence)} color="primary">
              <Tooltip title="Modifier">
                <EditIcon />
              </Tooltip>
            </IconButton>
          )}
          <IconButton onClick={() => handleDeleteAbsence(absence.id)} color="error">
            <Tooltip title="Supprimer">
              <DeleteIcon />
            </Tooltip>
          </IconButton>
        </Box>
      </Paper>
    </Grid>
  );
}