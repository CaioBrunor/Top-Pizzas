"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

import "./depth-flip-text.css";

gsap.registerPlugin(useGSAP, SplitText, ScrollTrigger);

const FRASES_PADRAO = [
  "Massa de fermentacao natural",
  "Forno a lenha, 450 graus",
  "Na sua porta em 35 minutos",
];

const CHAR_PERSPECTIVE = 1200;
const FLIP_EASE = "power4.inOut";

const DepthFlipText = ({
  phrases = FRASES_PADRAO,
  className = "",
  loop = false,
  holdDuration = 0.9,
  transitionDuration = 1.4,
  charStagger = 0.02,
  useOpacityTransition = false,
  scrub = false,
  scrollStart = "top 80%",
  scrollEnd = "bottom 20%",
  ativo = true,
}) => {
  const normalizedPhrases = useMemo(
    () => phrases.map((phrase) => phrase.trim()).filter(Boolean),
    [phrases],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);

  const containerRef = useRef(null);
  const currentRef = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const ready = document.fonts?.ready ?? Promise.resolve();

    ready.then(() => {
      if (!cancelled) setFontsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const displayIndex = scrub ? 0 : activeIndex;
  const isLast = displayIndex >= normalizedPhrases.length - 1;
  const hasNext = normalizedPhrases.length > 1 && (!isLast || (!scrub && loop));
  const nextIndex = isLast ? 0 : displayIndex + 1;
  const currentPhrase = normalizedPhrases[displayIndex] ?? "";
  const nextPhrase = hasNext ? (normalizedPhrases[nextIndex] ?? "") : "";

  useGSAP(
    () => {
      const currentEl = currentRef.current;
      const nextEl = nextRef.current;
      if (!fontsReady || !currentEl || !nextEl) return;

      // Parado: mostra a frase atual e não agenda ciclo nenhum.
      if (!ativo) return;

      const currentSplit = SplitText.create(currentEl, {
        type: "words, chars",
      });
      const nextSplit = SplitText.create(nextEl, { type: "words, chars" });
      const cleanup = () => {
        currentSplit.revert();
        nextSplit.revert();
      };

      const prefersReduced = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      gsap.set([currentEl, nextEl], { opacity: 1 });

      if (prefersReduced) {
        const limpar = {
          clearProps:
            "transform,transformOrigin,transformPerspective,backfaceVisibility,opacity",
        };
        gsap.set(currentSplit.chars, limpar);
        gsap.set(nextSplit.chars, limpar);
        gsap.set(nextEl, { opacity: hasNext ? 0 : 1 });

        if (!hasNext) return cleanup;

        gsap
          .timeline({
            delay: scrub ? 0 : holdDuration,
            onComplete: scrub ? undefined : () => setActiveIndex(nextIndex),
            scrollTrigger: scrub
              ? {
                  trigger: containerRef.current,
                  start: scrollStart,
                  end: scrollEnd,
                  scrub: true,
                }
              : undefined,
          })
          .to(
            currentEl,
            { opacity: 0, duration: transitionDuration, ease: "power2.out" },
            0,
          )
          .to(
            nextEl,
            { opacity: 1, duration: transitionDuration, ease: "power2.out" },
            0,
          );

        return cleanup;
      }

      if (!hasNext || !currentSplit.chars.length) {
        gsap.set(nextSplit.chars, { opacity: 0 });
        return cleanup;
      }

      // Medido em px a cada ciclo porque o GSAP le a origem em z com um
      // parseFloat simples.
      const faceOffset = currentSplit.chars[0].offsetHeight / 2;
      const faceProps = {
        transformOrigin: `50% 50% ${-faceOffset}px`,
        transformPerspective: CHAR_PERSPECTIVE,
        backfaceVisibility: "hidden",
        force3D: true,
      };

      gsap.set(currentSplit.chars, { ...faceProps, rotationX: 0, opacity: 1 });
      gsap.set(nextSplit.chars, {
        ...faceProps,
        rotationX: -90,
        opacity: useOpacityTransition ? 0 : 1,
      });

      const avancar = () => setActiveIndex(nextIndex);

      gsap
        .timeline({
          delay: scrub ? 0 : holdDuration,
          onComplete: scrub ? undefined : avancar,
          scrollTrigger: scrub
            ? {
                trigger: containerRef.current,
                start: scrollStart,
                end: scrollEnd,
                scrub: true,
              }
            : undefined,
        })
        .to(
          currentSplit.chars,
          {
            rotationX: 90,
            opacity: useOpacityTransition ? 0 : 1,
            duration: transitionDuration,
            ease: FLIP_EASE,
            stagger: charStagger,
          },
          0,
        )
        .to(
          nextSplit.chars,
          {
            rotationX: 0,
            opacity: 1,
            duration: transitionDuration,
            ease: FLIP_EASE,
            stagger: charStagger,
          },
          0,
        );

      return cleanup;
    },
    {
      scope: containerRef,
      revertOnUpdate: true,
      dependencies: [
        activeIndex,
        nextIndex,
        hasNext,
        fontsReady,
        currentPhrase,
        nextPhrase,
        ativo,
        scrub,
        scrollStart,
        scrollEnd,
        holdDuration,
        transitionDuration,
        charStagger,
        useOpacityTransition,
      ],
    },
  );

  return (
    <div
      ref={containerRef}
      className={`flip ${className}`.trim()}
      style={{ opacity: fontsReady ? 1 : 0 }}
    >
      <Frase
        key={`atual-${activeIndex}`}
        ref={currentRef}
        texto={currentPhrase}
      />
      <Frase
        key={`proxima-${nextIndex}`}
        ref={nextRef}
        texto={nextPhrase}
        secundaria
      />
    </div>
  );
};

const Frase = forwardRef(({ texto, secundaria = false }, ref) => (
  <p
    ref={ref}
    className={`flip__frase ${secundaria ? "flip__frase--atras" : ""}`.trim()}
  >
    {texto}
  </p>
));

Frase.displayName = "Frase";

export default DepthFlipText;
