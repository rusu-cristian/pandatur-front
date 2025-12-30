import { FaBars, FaTimes } from "react-icons/fa";
import "./BurgerButton.css";

/**
 * Burger Button Component
 * Toggle button for mobile menu with open/close states
 */
export const BurgerButton = ({ isOpen, onClick }) => (
  <button className="burger-btn" onClick={onClick} aria-label="Toggle menu">
    {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
  </button>
);
