import React from "react";
import Image from "next/image";
import footerStyle from "./footerStyle.module.sass";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGithub,
  faInstagram,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";
const Footer: React.FC<{}> = () => {
  return (
    <footer>
      <div className={footerStyle.footerContainer}>
        <Image className={footerStyle.footerLogo} alt="Webpage Logo"></Image>

        <form className={footerStyle.subscribeForm}>
          <input
            className={footerStyle.subscribeInput}
            type="email"
            placeholder="Enter your email"
          ></input>
          <button className={footerStyle.subscribeButton} type="submit">
            Subscribe
          </button>
        </form>
        <div className={footerStyle.footerLinks}>
          <a href="#">
            <FontAwesomeIcon icon={faInstagram} size="2x" />
          </a>
          <a href="#">
            <FontAwesomeIcon icon={faGithub} size="2x" />
          </a>
          <a href="#">
            <FontAwesomeIcon icon={faLinkedin} size="2x" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
