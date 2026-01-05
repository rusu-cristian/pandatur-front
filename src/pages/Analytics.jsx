import { useEffect } from "react";
import { Box, Group, Button, Paper } from "@mantine/core";
import { FaChartBar, FaRegCalendarCheck } from "react-icons/fa";
import { getLanguageByKey } from "../Components/utils";
import { CallStatsPage } from "./CallStatsPage";
import { EventsList } from "../Components/CallStats/EventsList";
import { useNavigate, useLocation } from "react-router-dom";
import "./Analytics.css";

export const Analytics = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const tab = location.pathname.endsWith("/events") ? "events" : "calls";

    const handleTabChange = (tabValue) => {
        navigate(tabValue === "calls" ? "/analytics/calls" : "/analytics/events", { replace: true });
    };

    useEffect(() => {
        if (location.pathname === "/analytics") {
            navigate("/analytics/calls", { replace: true });
        }
    }, [location.pathname, navigate]);

    return (
        <Box p={0} h="100%" className="analytics-container">
            <Paper
                p={0}
                withBorder
                className="analytics-tabs-panel"
            >
                <Group className="analytics-tabs-group">
                    <Button
                        variant="outline"
                        size="lg"
                        radius="lg"
                        leftSection={<FaChartBar size={20} />}
                        className={`analytics-tab-button ${tab === "calls" ? "active" : "inactive"}`}
                        onClick={() => handleTabChange("calls")}
                    >
                        {getLanguageByKey("Calls")}
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        radius="lg"
                        leftSection={<FaRegCalendarCheck size={20} />}
                        className={`analytics-tab-button ${tab === "events" ? "active" : "inactive"}`}
                        onClick={() => handleTabChange("events")}
                    >
                        {getLanguageByKey("Events")}
                    </Button>
                </Group>
            </Paper>

            <div className="analytics-content">
                {tab === "calls" && <CallStatsPage />}
                {tab === "events" && <EventsList />}
            </div>
        </Box>
    );
};
