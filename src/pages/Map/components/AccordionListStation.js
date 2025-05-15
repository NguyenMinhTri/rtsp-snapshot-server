import * as React from "react";
import { styled } from "@mui/material/styles";
import ArrowForwardIosSharpIcon from "@mui/icons-material/ArrowForwardIosSharp";
import MuiAccordion from "@mui/material/Accordion";
import MuiAccordionSummary from "@mui/material/AccordionSummary";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import CardStatus from "../../Generality/components/StatusPercent/CardStatus";
import { Box } from "@mui/material";

const Accordion = styled((props) => (
    <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
    border: `1px solid ${theme.palette.divider}`,
    "&:not(:last-child)": {
        borderBottom: 0,
    },
    "&:before": {
        display: "none",
    },
}));

const AccordionSummary = styled((props) => (
    <MuiAccordionSummary
        expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: "0.9rem" }} />}
        {...props}
    />
))(({ theme }) => ({
    backgroundColor:
        theme.palette.mode === "dark"
            ? "rgba(255, 255, 255, .05)"
            : "rgba(0, 0, 0, .05)",
    flexDirection: "row-reverse",
    "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
        transform: "rotate(90deg)",
    },
    "& .MuiAccordionSummary-content": {
        marginLeft: theme.spacing(1),
    },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
    padding: 0,
    borderTop: "1px solid rgba(0, 0, 0, .125)",
}));

export default function AccordionListStation({ deviceType, listStation, expand = "pn0", handleClickCardStatus }) {
    const [expanded, setExpanded] = React.useState("pn0");

    const handleChange = (panel) => (event, newExpanded) => {
        setExpanded(newExpanded ? panel : false);
    };
    

    return (
        <div>
            <Accordion
                expanded={expanded === expand}
                onChange={handleChange(expand)}
            >
                <AccordionSummary
                    aria-controls="panel1d-content"
                    id="panel1d-header"
                >
                    <Typography>{deviceType || "Loại trạm"} ({ listStation && listStation.length || 0})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {listStation && listStation.length > 0 ? listStation.map((v) => 
                      <Box onClick={() => handleClickCardStatus(v.station)} style={{cursor : 'pointer'}}>

                    <CardStatus
                        
                            style={{
                                padding: "8px",
                                borderTop: "0.5px solid #ccc",
                            }}
                            title={ v.station}
                            status={ v.status}
                        />
                      </Box>
                        
                        ) 
                        
                     : (
                        <CardStatus
                            style={{
                                padding: "8px",
                                borderTop: "0.5px solid #ccc",
                            }}
                            title="Không có trạm"
                            status="off"
                        />
                    )}
                </AccordionDetails>
            </Accordion>
        </div>
    );
}
