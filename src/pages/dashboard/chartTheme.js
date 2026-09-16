import { useSelector } from "react-redux";

/**
 * Colours for the dashboard charts, checked with the data-viz palette
 * validator rather than picked by eye.
 *
 * Every chart here answers a magnitude-or-trend question, never an identity
 * one, so none of them carries a categorical palette: the current period takes
 * the brand hue and the comparison period recedes into grey — the "emphasis"
 * form. That also sidesteps the number of branches and packages being unknown
 * until the data arrives; a generated ninth hue would be indistinguishable
 * from an existing one anyway.
 *
 * Light pair clears both gates: normal-vision ΔE 15.9, both at or above 3:1 on
 * white. In dark mode the two cannot both clear everything — pulling the grey
 * far enough from the accent to stay tellable apart (ΔE 20.1) drops it to
 * 2.55:1 on the dark surface. The method allows that only with relief, which
 * is why every chart ships the same numbers as a table underneath it.
 */
export const useChartTheme = () => {
  const isDark = useSelector((state) => state.app.theme) === "dark";

  return {
    isDark,
    // G2's own theme handles axis, grid and label ink for the surface.
    g2Theme: isDark ? "classicDark" : "classic",
    emphasis: isDark ? "#7B80E0" : "#3F4196",
    context: isDark ? "#565D6B" : "#667085",
  };
};

export default useChartTheme;
