import React from "react";
import footerStyle from "./footerStyle.module.sass";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGithub,
  faInstagram,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";
import { Stack, IconButton } from "@mui/material";

const Footer: React.FC<{}> = () => {
  return (
    <div className={footerStyle.footerContainer}>
      <Stack direction="row" spacing={1}>
        <IconButton color="primary" aria-label="add to shopping cart">
          <FontAwesomeIcon icon={faInstagram} />
        </IconButton>
        <IconButton color="primary" aria-label="add to shopping cart">
          <FontAwesomeIcon icon={faGithub} />
        </IconButton>
        <IconButton color="primary" aria-label="add to shopping cart">
          <FontAwesomeIcon icon={faLinkedin} />
        </IconButton>
      </Stack>
    </div>
  );
};

export default Footer;
