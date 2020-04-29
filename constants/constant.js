
  export const DEFAULT_VALUES = {
    MAX_LENGTH_PASSWORD_GENERATE: 8,
    COUNTRY_CODE_US: 'US',  // Support get list state in US.
    ITU_US: '+1',  // The International Telecommunication Union (ITU) default is US: +1
    MAX_LENGTH_PHONE_US: 10,  // Max length phone number of US: 10 digits.
    ITEM_PER_PAGE: 20,
    TOKEN_EXPIRED: 5 * 30 * 24 * 60 * 60 * 1000, // 5 months,
    RESET_PASSWORD_EXPIRED: 15 * 60 * 1000, // 15 mins
  };
  
  const WORK_DOMAIN = {
    UI:"UI",
    UX:"UX"
  }
  
  const OFFICE_LOCATIONS = {
    NDA_IN:"Noida",
    BLR_IN:"Banglore",
    HYD_IN:"Hyderabad",
    KOL_IN:"Kolkata",
    SC_US:"Santa Clara"
  }
  
  const ROLES = {
    ADMIN:"ADMIN",
    USER:"USER"
  }
  
  const STATUS = {
    ACTIVE:"Active",
    INACTIVE:"In Active",
    ALIGNED:"Aligned"
  }
  
  module.exports =  {
    DEFAULT_VALUES,
    WORK_DOMAIN,
    OFFICE_LOCATIONS,
    ROLES,
    STATUS
  };
  
  