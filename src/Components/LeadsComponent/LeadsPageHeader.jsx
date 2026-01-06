import { memo, forwardRef, useCallback } from "react";
import { Button, ActionIcon, Input, SegmentedControl, Flex, Select, Loader } from "@mantine/core";
import { PageHeader } from "@components";
import { useMobile } from "@hooks";
import Can from "../CanComponent/Can";
import { getLanguageByKey } from "../utils";
import { VIEW_MODE } from "./constants";
import { FaTrash, FaEdit, FaList } from "react-icons/fa";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { TbLayoutKanbanFilled } from "react-icons/tb";
import { LuFilter } from "react-icons/lu";
import { Search as SearchIcon } from "@mui/icons-material";

/**
 * ViewModeLink — ссылка для переключения режима
 * 
 * Progressive Enhancement:
 * - Обычный клик → preventDefault + JS обработчик (фильтры сохраняются)
 * - Cmd/Ctrl+Click или правый клик → открывает URL в новой вкладке
 */
const ViewModeLink = ({ href, onClick, children, isActive }) => {
  const handleClick = useCallback((e) => {
    // Если Cmd/Ctrl/Shift — пусть браузер откроет в новой вкладке
    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      return;
    }
    // Иначе — предотвращаем переход и используем JS
    e.preventDefault();
    onClick?.();
  }, [onClick]);

  return (
    <a
      href={href}
      onClick={handleClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      {children}
    </a>
  );
};

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
  
  // URL для режимов (с сохранёнными фильтрами)
  kanbanUrl,
  listUrl,
  
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
  const isMobile = useMobile();
  const desktopControlSize = isMobile ? undefined : "xs";
  const actionIconSize = isMobile ? 36 : 27;
  const controlIconSize = isMobile ? 16 : 12;
  const controlMinWidthStyle = isMobile ? undefined : { minWidth: 225 };
  const searchRightMargin = isMobile ? "20px" : "15px";
  const searchActionSize = isMobile ? "sm" : "xs";

  return (
    <Flex
      ref={ref}
      style={{
        "--side-bar-width": isCollapsed
          ? "var(--sidebar-width-collapsed)"
          : "var(--sidebar-width-expanded)",
      }}
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
                  <Button
                    variant="danger"
                    size={desktopControlSize}
                    leftSection={<FaTrash size={controlIconSize} />}
                    onClick={onDelete}
                  >
                    {getLanguageByKey("Ștergere")} ({selectedTickets.length})
                  </Button>
                </Can>
                <Can permission={{ module: "leads", action: "edit" }} context={{ responsibleId }}>
                  <Button
                    variant="warning"
                    size={desktopControlSize}
                    leftSection={<FaEdit size={controlIconSize} />}
                    onClick={onEdit}
                  >
                    {getLanguageByKey("Editare")} ({selectedTickets.length})
                  </Button>
                </Can>
              </>
            )}

            {/* Кнопка фильтра — onMouseDown для мгновенного отклика */}
            <ActionIcon
              variant={hasFilters ? "filled" : "default"}
              size={actionIconSize}
              onMouseDown={onFilterOpen}
            >
              <LuFilter size={controlIconSize} />
            </ActionIcon>

            {/* Поиск */}
            <Input
              value={searchInputValue}
              onChange={onSearchInputChange}
              onKeyPress={onSearchKeyPress}
              placeholder={getLanguageByKey("Cauta dupa Lead, Client sau Tag")}
              className="min-w-300"
              size={desktopControlSize}
              style={controlMinWidthStyle}
              rightSectionPointerEvents="all"
              rightSection={
                <Flex gap="xs" align="center" mr={searchRightMargin}>
                  {isLoading ? (
                    <Loader size="xs" />
                  ) : (
                    <ActionIcon
                      variant="subtle"
                      onClick={onSearch}
                      disabled={!hasSearchValue}
                      size={searchActionSize}
                    >
                      <SearchIcon style={{ fontSize: controlIconSize }} />
                    </ActionIcon>
                  )}
                  {hasSearchValue && (
                    <ActionIcon variant="subtle" onClick={onSearchClear} size={searchActionSize}>
                      <IoMdClose size={controlIconSize} />
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
              size={desktopControlSize}
              style={controlMinWidthStyle}
              onChange={onGroupTitleChange}
            />

            {/* Переключатель Kanban/List */}
            <SegmentedControl
              onChange={onViewModeChange}
              value={viewMode}
              size={desktopControlSize}
              data={[
                {
                  value: VIEW_MODE.KANBAN,
                  label: (
                    <ViewModeLink
                      href={kanbanUrl}
                      onClick={() => onViewModeChange(VIEW_MODE.KANBAN)}
                      isActive={viewMode === VIEW_MODE.KANBAN}
                    >
                      <TbLayoutKanbanFilled
                        size={controlIconSize}
                        color="var(--crm-ui-kit-palette-text-primary)"
                      />
                    </ViewModeLink>
                  )
                },
                {
                  value: VIEW_MODE.LIST,
                  label: (
                    <ViewModeLink
                      href={listUrl}
                      onClick={() => onViewModeChange(VIEW_MODE.LIST)}
                      isActive={viewMode === VIEW_MODE.LIST}
                    >
                      <FaList size={controlIconSize} color="var(--crm-ui-kit-palette-text-primary)" />
                    </ViewModeLink>
                  )
                },
              ]}
            />

            {/* Кнопка создания */}
            <Can permission={{ module: "leads", action: "create" }}>
              <Button size={desktopControlSize} onClick={onCreate} leftSection={<IoMdAdd size={controlIconSize} />}>
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
