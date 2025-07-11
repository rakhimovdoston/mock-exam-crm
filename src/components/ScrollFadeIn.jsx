// components/ScrollFadeIn.js
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const ScrollFadeIn = ({ children, delay = 0.2 }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
};

export default ScrollFadeIn;
