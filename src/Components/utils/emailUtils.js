// Карта email адресов по воронкам (group_title)
export const groupEmailsMap = {

  "MD": ["oferte@pandatur.md"],
  
  "RO": ["oferte@pandatour.ro"],

  "IndividualGroups": ["explorix.moldova@gmail.com"],

  // Филиалы
  "Filiale": [
    "balti@pandatur.md",
    "falesti@pandatur.md",
    "ungheni@pandatur.md",
    "calarasi@pandatur.md",
    "cahul@pandatur.md"
  ],

  // Green Card
  "GreenCard": ["greencard@pandatur.md"],

  // Франшизы
  "FranchiseEdinet": ["edinet@pandatour.md"],
  "FranchiseDrochia": ["drochia@pandatour.md"],
  "FranchiseIaloveni": ["ialoveni@pandatour.md"],
  "FranchiseChisinauBuiucani": ["buiucani@pandatour.md"],
  "FranchiseCauseni": ["causeni@pandatour.md"],
  "FranchiseSoldanesti": ["soldanesti@pandatour.md"],
  "FranchiseOrhei": ["orhei@pandatour.md"],
  "FranchiseCantemir": ["cantemir@pandatour.md"],
  "FranchiseChisinauRiscani": ["sect.riscani@pandatour.md"],
  "FranchiseTimisoara": ["timisoara@pandatour.ro"],
  "FranchiseNisporeni": ["nisporeni@pandatour.md"],
  "FranchiseCluj": ["clujfranchise@pandatour.ro"],
  "FranchiseStauceni": ["stauceni@pandatour.md"],
  "FranchiseHincesti": ["hincesti@pandatour.md"]
};

// Функция для получения email адресов по воронке
export const getEmailsByGroupTitle = (groupTitle) => {
  if (!groupTitle) return [];
  return groupEmailsMap[groupTitle] || [];
};

// Функция для получения всех доступных email адресов
export const getAllGroupEmails = () => {
  return Object.values(groupEmailsMap).flat();
};

// Функция для проверки, есть ли email адреса для воронки
export const hasEmailsForGroup = (groupTitle) => {
  return getEmailsByGroupTitle(groupTitle).length > 0;
};

// Функция для получения первого email адреса воронки (для автозаполнения)
export const getFirstEmailForGroup = (groupTitle) => {
  const emails = getEmailsByGroupTitle(groupTitle);
  return emails.length > 0 ? emails[0] : null;
};
