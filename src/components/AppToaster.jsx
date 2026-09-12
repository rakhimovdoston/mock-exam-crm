import React from "react";
import { Slide, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/toast.css";

/**
 * The app's single toast outlet.
 *
 * The container stays on the library's "light" theme on purpose: our stylesheet
 * points its light-theme variables at the app's own theme-aware tokens, so the
 * same rules render correctly in night mode too.
 */
const AppToaster = () => (
  <ToastContainer
    position="top-center"
    transition={Slide}
    autoClose={3500}
    limit={3}
    newestOnTop
    closeOnClick
    draggable
    pauseOnHover
    pauseOnFocusLoss={false}
    hideProgressBar={false}
    icon
  />
);

export default AppToaster;
