import { Flex } from "@mantine/core";
import { useRef, useEffect, useContext } from "react";
import { WorkflowColumn } from "./components";
import { useGetTechniciansList } from "../../hooks";
import { useUI } from "../../contexts/UIContext";
import { UserContext } from "../../contexts/UserContext";
import "./WorkflowColumns.css";

export const WorkflowColumns = ({
  tickets,
  searchTerm,
  onEditTicket,
  fetchTickets,
  refreshKanbanTickets,
  kanbanFilterActive,
  selectedWorkflow,
}) => {
  const { technicians } = useGetTechniciansList();
  const { isCollapsed } = useUI();
  const { workflowOptions } = useContext(UserContext);

  const wrapperRef = useRef(null);
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
  });

  const excludedWorkflows = ["Realizat cu succes", "Închis și nerealizat"];

  const visibleWorkflows = kanbanFilterActive
    ? selectedWorkflow?.length
      ? selectedWorkflow
      : workflowOptions
    : workflowOptions.filter((w) => !excludedWorkflows.includes(w));

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const handleMouseDown = (e) => {
      dragRef.current = {
        isDragging: true,
        startX: e.pageX - el.offsetLeft,
        scrollLeft: el.scrollLeft,
      };
      document.body.style.userSelect = "none";
    };

    const handleMouseMove = (e) => {
      if (!dragRef.current.isDragging) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = x - dragRef.current.startX;
      el.scrollLeft = dragRef.current.scrollLeft - walk;
    };

    const stopDragging = () => {
      dragRef.current.isDragging = false;
      document.body.style.userSelect = "";
    };

    el.addEventListener("mousedown", handleMouseDown);
    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseup", stopDragging);
    el.addEventListener("mouseleave", stopDragging);

    return () => {
      el.removeEventListener("mousedown", handleMouseDown);
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseup", stopDragging);
      el.removeEventListener("mouseleave", stopDragging);
    };
  }, [isCollapsed]);

  return (
    <div
      ref={wrapperRef}
      className="workflow-columns"
    >
      <Flex gap="6" w="fit-content" h="100%" pt="8px">
        {visibleWorkflows.map((workflow) => (
          <WorkflowColumn
            key={workflow}
            workflow={workflow}
            tickets={tickets}
            searchTerm={searchTerm}
            onEditTicket={onEditTicket}
            technicianList={technicians}
            fetchTickets={fetchTickets}
            refreshKanbanTickets={refreshKanbanTickets}
          />
        ))}
      </Flex>
    </div>
  );
};
