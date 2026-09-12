import React from "react";
import { Button, Tooltip } from "antd";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { flushSync } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { toggleTheme } from "../store/appReducer";
import { useT } from "../i18n/useT";

const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

const REVEAL_DURATION = 900;
const REVEAL_EASING = "cubic-bezier(0.32, 0.72, 0, 1)";
// The same curve reflected, so contracting looks like the reveal played backwards.
const HIDE_EASING = "cubic-bezier(1, 0, 0.68, 0.28)";
const REVERSE_CLASS = "theme-reveal-out";

// Light/dark switch. Night mode is revealed by a circle growing out of the
// button; switching back runs the same circle in reverse, shrinking the dark
// view back into the button.
const ThemeSwitcher = ({ type = "text" }) => {
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.app.theme);
  const t = useT();

  const isDark = mode === "dark";

  const handleToggle = async (event) => {
    const apply = () => dispatch(toggleTheme());

    if (!document.startViewTransition || prefersReducedMotion()) {
      apply();
      return;
    }

    // Grow from — or shrink into — the centre of the button that was clicked.
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Far enough to cover the furthest corner of the viewport.
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const revealing = !isDark; // going to night mode
    const root = document.documentElement;

    // Published before the snapshot so the incoming layer is already clipped on
    // its very first frame — otherwise it paints whole for a frame or two while
    // the script animation is still being scheduled.
    root.style.setProperty("--reveal-x", `${x}px`);
    root.style.setProperty("--reveal-y", `${y}px`);

    // Reverse direction draws the outgoing view on top; see src/index.css.
    root.classList.toggle(REVERSE_CLASS, !revealing);

    const transition = document.startViewTransition(() => {
      // flushSync so the frame the browser snapshots already has the new theme.
      flushSync(apply);
    });

    transition.finished
      .catch(() => {})
      .finally(() => root.classList.remove(REVERSE_CLASS));

    try {
      await transition.ready;
    } catch {
      return; // another transition interrupted this one
    }

    const clip = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`,
    ];

    const [from, to] = revealing ? clip : [...clip].reverse();

    // The clipped layer also ramps its opacity, so the moving edge blends the
    // two palettes instead of cutting between them at full brightness — that
    // hard luminance step is what makes a theme flip feel like a flash.
    root.animate(
      [
        { clipPath: from, opacity: revealing ? 0.55 : 1 },
        { clipPath: to, opacity: revealing ? 1 : 0.55 },
      ],
      {
        duration: REVEAL_DURATION,
        easing: revealing ? REVEAL_EASING : HIDE_EASING,
        // Without this the layer snaps back to its natural, unclipped state the
        // moment the animation ends — which is a full-screen flash of the theme
        // being replaced, because the shrinking layer is the one on top.
        fill: "forwards",
        pseudoElement: revealing
          ? "::view-transition-new(root)"
          : "::view-transition-old(root)",
      }
    );
  };

  return (
    <Tooltip title={isDark ? t("nav.lightMode") : t("nav.darkMode")}>
      <Button
        type={type}
        aria-label={isDark ? t("nav.lightMode") : t("nav.darkMode")}
        icon={isDark ? <SunOutlined /> : <MoonOutlined />}
        onClick={handleToggle}
      />
    </Tooltip>
  );
};

export default ThemeSwitcher;
