import { Autocomplete, Avatar, Chip, TextField } from "@mui/material";
import { User } from "../pages/Messages/NewMessage";
import { Box } from "@mui/system";
import { FiberManualRecord } from "@mui/icons-material";
import { useSocket } from "../contexts/SocketContext";
import { useEffect, useState } from "react";
import { API_URL } from "../const";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

type UsersAutocompleteProps = {
  showAlert: (message: string, severity: "success" | "error") => void;
  withUsersStatus?: boolean;
  renderLabel: string;
  //multipleSelection?: boolean;
  //selectedUser: User | User[] | null;
  //setSelectedUser: React.Dispatch<React.SetStateAction<User[] | (User | null)>>;
} & ({
  multipleSelection?: false;
  selectedUser: User | null;
  setSelectedUser: React.Dispatch<React.SetStateAction<User | null>>;
} | {
  multipleSelection?: true;
  selectedUser: User[] | null;
  setSelectedUser: React.Dispatch<React.SetStateAction<User[]>>;
})

const UsersAutocomplete : React.FC<UsersAutocompleteProps> = ({selectedUser, setSelectedUser, showAlert, renderLabel, withUsersStatus = false, multipleSelection = false}) => {
  const { isOnline } = useSocket();
  const {user: currentUser} = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    console.log(renderLabel, withUsersStatus, currentUser)
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      setIsDisabled(true);
      const token = localStorage.getItem('token');
      
      const { data } = await axios.get(API_URL + '/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const filteredUsers = data.data.filter((userData: User) => userData.id !== (currentUser?.userId ?? 0));
      setUsers(filteredUsers);
      setIsDisabled(false);
    } catch (error) {
      console.error(error)
      showAlert('Erreur lors du chargement des utilisateurs', 'error');
      setIsDisabled(false);
    }
  };

  return (
    <Autocomplete
      value={selectedUser}
      multiple={multipleSelection}
      onChange={(_, newValue) => {
        (setSelectedUser as any)(newValue);
      }}
      disabled={isDisabled}
      options={users}
      getOptionLabel={(option) => `${option.firstname} ${option.lastname}`}
      renderOption={(props, option) => {
        const {key, ...rest} = props;
        return (
        <Box component="li" key={key} {...rest}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Avatar sx={{ mr: 2 }}>{option.firstname.charAt(0)}</Avatar>
            <Box sx={{ flexGrow: 1 }}>
              {option.firstname} {option.lastname}
            </Box>
            {withUsersStatus && <Chip
              icon={<FiberManualRecord sx={{ fontSize: 14 }} />}
              label={isOnline(option.id) ? "En ligne" : "Hors ligne"}
              color={isOnline(option.id) ? "success" : "default"}
              size="small"
            />}
          </Box>
        </Box>
      )}}
      renderInput={(params) => (
        <TextField
          {...params}
          label={renderLabel}
          variant="outlined"
          fullWidth
          sx={{ mb: 3 }}
        />
      )}
    />
  );
}

export default UsersAutocomplete;
