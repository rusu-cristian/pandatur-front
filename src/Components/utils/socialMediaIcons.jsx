import {
  FaFacebook,
  FaViber,
  FaInstagram,
  FaWhatsapp,
  FaTelegram,
} from "react-icons/fa";

const IconWrapper = ({ children, bgColor }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "24px",
      height: "24px",
      borderRadius: "12px",
      backgroundColor: bgColor,
      padding: "2px",
    }}
  >
    {children}
  </div>
);

export const socialMediaIcons = {
  facebook: (
    <IconWrapper bgColor="#1877F2">
      <FaFacebook color="white" />
    </IconWrapper>
  ),
  instagram: (
    <IconWrapper bgColor="#C13584">
      <FaInstagram color="white" />
    </IconWrapper>
  ),
  whatsapp: (
    <IconWrapper bgColor="#25D366">
      <FaWhatsapp color="white" />
    </IconWrapper>
  ),
  viber: (
    <IconWrapper bgColor="#7360F2">
      <FaViber color="white" />
    </IconWrapper>
  ),
  telegram: (
    <IconWrapper bgColor="#0088cc">
      <FaTelegram color="white" />
    </IconWrapper>
  ),
  "viber-bot": (
    <IconWrapper bgColor="#7360F2">
      <img src="/viber-bot.svg" alt="Viber Bot" style={{ width: "24px", height: "24px" }} />
    </IconWrapper>
  )
};
