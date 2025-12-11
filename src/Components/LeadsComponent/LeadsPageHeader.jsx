import { memo, forwardRef } from "react";
import { Button, ActionIcon, Input, SegmentedControl, Flex, Select, Loader } from "@mantine/core";
import { PageHeader } from "@components";
import Can from "../CanComponent/Can";
import { getLanguageByKey } from "../utils";
import { VIEW_MODE } from "./constants";
import { FaTrash, FaEdit, FaList } from "react-icons/fa";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { TbLayoutKanbanFilled } from "react-icons/tb";
import { LuFilter } from "react-icons/lu";
import { Search as SearchIcon } from "@mui/icons-material";

/**
 * Header страницы Leads
 * 
 * Содержит:
 * - Счётчик тикетов
 * - Кнопки массовых действий
 * - Фильтр
 * - Поиск
 * - Селектор группы
 * - Переключатель Kanban/List
 * - Кнопка создания
 */
export const LeadsPageHeader = memo(forwardRef(({
  // Данные
  ticketCount,
  viewMode,
  isCollapsed,
  hasFilters,
  isLoading,
  selectedTickets,
  responsibleId,
  groupTitleValue,
  groupTitleSelectData,
  
  // Поиск
  searchInputValue,
  hasSearchValue,
  onSearchInputChange,
  onSearchKeyPress,
  onSearch,
  onSearchClear,
  
  // Действия
  onFilterOpen,
  onGroupTitleChange,
  onViewModeChange,
  onDelete,
  onEdit,
  onCreate,
}, ref) => {
  return (
    <Flex
      ref={ref}
      style={{ "--side-bar-width": isCollapsed ? "79px" : "249px" }}
      className="leads-header-container"
      bg="var(--crm-ui-kit-palette-background-primary)"
    >
      <PageHeader
        count={ticketCount}
        title={getLanguageByKey("Leads")}
        extraInfo={
          <>
            {/* Кнопки массовых действий */}
            {selectedTickets.length > 0 && (
              <>
                <Can permission={{ module: "leads", action: "delete" }} context={{ responsibleId }}>
                  <Button variant="danger" leftSection={<FaTrash size={16} />} onClick={onDelete}>
                    {getLanguageByKey("Ștergere")} ({selectedTickets.length})
                  </Button>
                </Can>
                <Can permission={{ module: "leads", action: "edit" }} context={{ responsibleId }}>
                  <Button variant="warning" leftSection={<FaEdit size={16} />} onClick={onEdit}>
                    {getLanguageByKey("Editare")} ({selectedTickets.length})
                  </Button>
                </Can>
              </>
            )}

            {/* Кнопка фильтра */}
            <ActionIcon
              variant={hasFilters ? "filled" : "default"}
              size="36"
              onClick={onFilterOpen}
            >
              <LuFilter size={16} />
            </ActionIcon>

            {/* Поиск */}
            <Input
              value={searchInputValue}
              onChange={onSearchInputChange}
              onKeyPress={onSearchKeyPress}
              placeholder={getLanguageByKey("Cauta dupa Lead, Client sau Tag")}
              className="min-w-300"
              rightSectionPointerEvents="all"
              rightSection={
                <Flex gap="xs" align="center" mr="20px">
                  {isLoading ? (
                    <Loader size="xs" />
                  ) : (
                    <ActionIcon
                      variant="subtle"
                      onClick={onSearch}
                      disabled={!hasSearchValue}
                      size="sm"
                    >
                      <SearchIcon fontSize="small" />
                    </ActionIcon>
                  )}
                  {hasSearchValue && (
                    <ActionIcon variant="subtle" onClick={onSearchClear} size="sm">
                      <IoMdClose size={16} />
                    </ActionIcon>
                  )}
                </Flex>
              }
            />

            {/* Селектор группы */}
            <Select
              placeholder={getLanguageByKey("filter_by_group")}
              value={groupTitleValue}
              data={groupTitleSelectData}
              className="min-w-300"
              onChange={onGroupTitleChange}
            />

            {/* Переключатель Kanban/List */}
            <SegmentedControl
              onChange={onViewModeChange}
              value={viewMode}
              data={[
                {
                  value: VIEW_MODE.KANBAN,
                  label: (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <TbLayoutKanbanFilled color="var(--crm-ui-kit-palette-text-primary)" />
                    </div>
                  )
                },
                {
                  value: VIEW_MODE.LIST,
                  label: (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FaList color="var(--crm-ui-kit-palette-text-primary)" />
                    </div>
                  )
                },
              ]}
            />

            {/* Кнопка создания */}
            <Can permission={{ module: "leads", action: "create" }}>
              <Button onClick={onCreate} leftSection={<IoMdAdd size={16} />}>
                {getLanguageByKey("Adaugă lead")}
              </Button>
            </Can>
          </>
        }
      />
    </Flex>
  );
}));

LeadsPageHeader.displayName = "LeadsPageHeader";

