import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { Box } from "@mui/system";
import UsersAutocomplete from "../UsersAutocomplete";
import { DetailedMessageGroup, PatchMessageGroupRequestBody, User } from "../../types/messages-types";
import { API_URL } from "../../const";
import axios, { AxiosResponse } from "axios";

interface GroupEditingModalProps{
  dialogOpen: boolean;
  setDialogOpen: (dialogOpen: boolean) => void;
  showAlert: (message: string, severity: "success" | "error") => void;
  editedGroup: DetailedMessageGroup | undefined;
  setEditedGroup: (group: DetailedMessageGroup | undefined) => void;
  onGroupSave?: (requestResult: DetailedMessageGroup) => void;
  onCancel?: () => void;
}

const MessageGroupEditingModal : React.FC<GroupEditingModalProps> = ({dialogOpen, setDialogOpen, showAlert, editedGroup, setEditedGroup, onGroupSave = (_) => {}, onCancel = () => {}}) => {
  const handleEditGroup = async () => {
    if (editedGroup === undefined) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token provided.");
      return;
    }

    try {
      const {data} = await axios.patch<DetailedMessageGroup, AxiosResponse<DetailedMessageGroup>, PatchMessageGroupRequestBody>(
        API_URL + "/message-groups/" + editedGroup.id,
        {
          name: editedGroup.name,
          description: editedGroup.description,
          ownerId: editedGroup.owner.id,
          membersIDs: editedGroup.members.map(member => member.id),
        },
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );
      showAlert('Événement modifié avec succès', 'success');
      setDialogOpen(false);
      onGroupSave(data);
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || 'Erreur lors du chargement des messages';
      showAlert(errorMessage, 'error');
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setTimeout(() => onCancel(), 150);
  }

  return (
    <Dialog
      open={dialogOpen}
      onClose={closeDialog}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Modifier un groupe</DialogTitle>
      <DialogContent>
        { editedGroup === undefined ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TextField
              margin="normal"
              fullWidth
              label="Nom"
              value={editedGroup.name}
              onChange={(e) =>
                setEditedGroup({...editedGroup, name: e.target.value})
              }
              sx={{mb: 3}}
            />
            <TextField
              label="Description"
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              value={editedGroup.description}
              onChange={(e) => 
                setEditedGroup({...editedGroup, description: e.target.value})
              }
              sx={{mb: 3}}
            />
            <UsersAutocomplete
              selectedUser={editedGroup.owner}
              setSelectedUser={(user: User) => setEditedGroup({...editedGroup, owner: user})}
              showAlert={showAlert}
              renderLabel="Admin du groupe"
              withCurrentUser
            />
            <UsersAutocomplete
              multipleSelection
              selectedUser={editedGroup.members}
              setSelectedUser={(users: User[]) => setEditedGroup({...editedGroup, members: users})}
              showAlert={showAlert}
              renderLabel="Admin du groupe"
              withCurrentUser
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog}>
          Annuler
        </Button>
        <Button onClick={handleEditGroup}>Enregistrer</Button>
      </DialogActions>
    </Dialog>
  );
}

export default MessageGroupEditingModal;