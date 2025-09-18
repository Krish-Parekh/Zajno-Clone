import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";
import Lenis from 'lenis'

const lenis = new Lenis({
  autoRaf: true,
});

lenis.on('scroll', ScrollTrigger.update);

gsap.registerPlugin(ScrollTrigger);