import { Divider, Typography } from "@mui/material";
import StackBetween from "../../../../components/StackBeetwen";

const CardData = ({ title, data, percent }) => {
    return (
        <>
            <StackBetween>
                <Typography >{title} </Typography>
                <Typography>
                    {percent}% ({data} dữ liệu)
                </Typography>
            </StackBetween>
            <Divider />
        </>
    );
};

export default CardData;
