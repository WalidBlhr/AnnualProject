import { useEffect, useState } from "react";
import AdminPage, { Alert } from "./AdminPage";
import { Button, CircularProgress, Container, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField } from "@mui/material";
import axios, { AxiosResponse } from "axios";
import { API_URL } from "../../const";
import { ListingResult } from "../../types/ListingResult";
import { Delete, Edit } from "@mui/icons-material";
import { DetailedMessageGroup, MessageGroup, PatchMessageGroupRequestBody, User } from "../../types/messages-types";
import { Box } from "@mui/system";
import UsersAutocomplete from "../../components/UsersAutocomplete";

const tableHeaders = ["ID", "Nom", "Description", "Date de création", "Action"];

const AdminMessageGroups : React.FC = () => {
  const [alert, setAlert] = useState<Alert>({open: false, message: "", severity: "success"});
  const [viewDialogOpen, setEditDialogOpen] = useState(false);

  const [groups, setGroups] = useState<MessageGroup[]>([]);
  const [totalGroups, setTotalGroups] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [editedGroup, setEditedGroup] = useState<DetailedMessageGroup>();

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    fetchMessageGroups();
  }, [page, rowsPerPage]);

  const requestWrapper = async (
    req: (token: string) => Promise<void>,
    catch_add: () => void = () => {}
  ) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token provided.");
      return;
    }

    try {
      await req(token);
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || 'Erreur lors du chargement des messages';
      showAlert(errorMessage, 'error');
      catch_add();
    }
  }

  const fetchMessageGroups = async () => {
    requestWrapper(async token => {
      const {data} = await axios.get<ListingResult<MessageGroup[]>>(
        API_URL + "/message-groups",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
          params: {
            page: page + 1,
            limit: rowsPerPage,
          },
        }
      );
      setGroups(data.data.sort((gA, gB) => gA.id - gB.id));
      setTotalGroups(data.total_count);
    });
  };

  const handleEditGroup = async () => {
    if (editedGroup === undefined) {
      return;
    }

    requestWrapper(async token => {
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
      setEditDialogOpen(false);
      setGroups(groups.map(group => {
        if (group.id === data.id)
          return data;
        else
          return group;
      }));
    });
  };

  const handleDeleteGroup = async (groupId: number) => {
    requestWrapper(async token => {
      await axios.delete(
        API_URL + "/message-groups/" + groupId,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );
      showAlert("Groupe supprimé avec succès", "success");
      setGroups(prev => prev.filter(group => group.id !== groupId));
    });
  };

  const fetchGroupDetails = async (groupId: number) => {
    requestWrapper(async token => {
      const {data} = await axios.get<DetailedMessageGroup>(
        API_URL + "/message-groups/" + groupId,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );
      setEditedGroup(data);
    }, () => setEditDialogOpen(false));
  }

  const onEditClick = async (group: MessageGroup) => {
    setEditDialogOpen(true);
    await fetchGroupDetails(group.id);
  }

  return (
    <AdminPage
      title="Gestion des groupes de messages"
      alert={alert}
      setAlert={setAlert}
    >
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {tableHeaders.map((header, i) => <TableCell key={i}>{header}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map(group => (
              <AdminMessageGroupRow
                key={group.id}
                group={group}
                onEditClick={onEditClick}
                onDeleteClick={handleDeleteGroup}
              />
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalGroups}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      <Dialog
        open={viewDialogOpen}
        onClose={() => setEditDialogOpen(false)}
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
          <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleEditGroup}>Enregistrer</Button>
        </DialogActions>
      </Dialog>
    </AdminPage>
  );
};

interface RowProps{
  group: MessageGroup;
  onEditClick: (group: MessageGroup) => void;
  onDeleteClick: (groupId: number) => void;
}

const AdminMessageGroupRow : React.FC<RowProps> = ({group, onEditClick, onDeleteClick}) => {
  return (
    <TableRow>
      <TableCell>{group.id}</TableCell>
      <TableCell>{group.name}</TableCell>
      <TableCell>{group.description}</TableCell>
      <TableCell>{group.createdAt.toLocaleString()}</TableCell>
      <TableCell>
        <IconButton onClick={() => onEditClick(group)}>
          <Edit />
        </IconButton>
        <IconButton onClick={() => onDeleteClick(group.id)}>
          <Delete />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

export default AdminMessageGroups;
