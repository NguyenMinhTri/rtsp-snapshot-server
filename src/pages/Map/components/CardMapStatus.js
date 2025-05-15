import { Paper, Typography } from '@mui/material';
import React from 'react'

const CardMapStatus = ({ color, count = 11, name = "Hoạt động tốt",onClick }) => {
    return (
        <Paper component={"div"}   onClick={onClick}  elevation={3} sx={{ backgroundColor: color, cursor : 'pointer' }} >
            <Typography
                p={1}
                variant="h4"
                textAlign={"center"}
                style={{ fontWeight: "800", color: "white"
               

                
             }}
            >
                {count}
                <Typography
                    p={1}
                    textAlign={"center"}
                    style={{ fontWeight: "600", padding : 0 , overflow:'hidden',
                    display:" -webkit-box",
                    WebkitLineClamp: 1,
                    lineClamp:1,
                    WebkitBoxOrient: "vertical"}}
                >
                    {name}
                </Typography>
            </Typography>
        </Paper>
    );
};


export default CardMapStatus