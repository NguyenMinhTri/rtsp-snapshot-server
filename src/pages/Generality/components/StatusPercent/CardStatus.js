import { Stack, Typography } from "@mui/material";
import StackBetween from "../../../../components/StackBeetwen";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { colorStationStatus } from "../../../../constants";

const CardStatus = ({ title, status, style  }) => {
    return (
        <Stack
            style={style ?? {
                // backgroundColor: "#f5f5f5",
                padding: "8px",
                borderRadius: "5px",
                border: "1px solid #ccc",
            }}
        >
            <StackBetween>
                <Typography>{title}</Typography>
                <FiberManualRecordIcon
                    fontSize="10px"
                    style={{ color: colorStationStatus[status] }}
                />
            </StackBetween>
        </Stack>
    );
};

export default CardStatus;
