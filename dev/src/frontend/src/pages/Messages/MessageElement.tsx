import {Avatar, Box, ListItem, Paper, Typography} from "@mui/material";
import { Message } from "./Conversation";
import { useAuth } from "../../contexts/AuthContext";

interface MessageElementProps{
    message: Message;
}

export function MessageElement({message} : MessageElementProps) {
    const {user} = useAuth();
    const isOwnMessage : Boolean = (user?.userId ?? 0) === message.sender.id;

    return ( user ?
        <ListItem
            sx={{ 
                justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                mb: 1
            }}
        >
            <Box sx={{ 
                display: 'flex', 
                flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                maxWidth: '80%'
            }}>
                {!isOwnMessage && (
                <Avatar sx={{ mr: 1 }}>
                    {message.sender.firstname.charAt(0)}
                </Avatar>
                )}
                
                <Paper sx={{ 
                p: 2, 
                bgcolor: isOwnMessage ? 'primary.light' : 'grey.100', 
                color: isOwnMessage ? 'white' : 'inherit',
                borderRadius: 2,
                ml: isOwnMessage ? 1 : 0,
                mr: isOwnMessage ? 0 : 1
                }}>
                    <Typography 
                        variant="body1" 
                        component="div" // Changement ici: utiliser div au lieu de p
                    >
                        {message.content}
                    </Typography>
                    <Typography 
                        variant="caption" 
                        component="div" // Changement ici: utiliser div au lieu de p
                        sx={{ 
                        textAlign: 'right',
                        mt: 0.5
                        }}
                    >
                        {new Date(message.date_sent).toLocaleTimeString()}
                    </Typography>
                </Paper>
                
                {isOwnMessage && (
                    <Avatar sx={{ ml: 1 }}>
                        {user.userId ? localStorage.getItem('firstname')?.charAt(0) : 'Y'}
                    </Avatar>
                )}
            </Box>
        </ListItem>
    : null);
}