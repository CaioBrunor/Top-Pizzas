import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import DepthFlipText from "../animations/DepthFlipText";
import CartaoProduto from "../components/CartaoProduto";
import ModalProduto from "../components/ModalProduto";
import { useLoja } from "../context/LojaContext";
import { IconeChama, IconeMoto, IconeSeta } from "../components/Icones";

gsap.registerPlugin(ScrollTrigger);

const ETAPAS = [
  {
    titulo: "Fermentação natural de 48 horas",
    texto:
      "Fermentação natural lenta, com cuidado e carinho para o seu paladar. É o que deixa a borda tão leve.",
  },
  {
    titulo: "Forno a Lenha",
    texto:
      "Lenha com temperatura de 450 graus. A pizza fica 90 segundos e sai quente, macia e com uma borda pra lá de crocante.",
  },
  {
    titulo: "Entrega Rápida",
    texto:
      "Entrega e preparo extremamente rápido para evitar ansiedade e fazer tudo com extremo carinho.",
  },
];

export default function Inicio() {
  const { produtos } = useLoja();
  const [selecionado, setSelecionado] = useState(null);
  const [noTopo, setNoTopo] = useState(true);
  const paginaRef = useRef(null);

  const destaques = produtos
    .filter((p) => p.destaque && p.disponivel)
    .slice(0, 4);

  useGSAP(
    () => {
      const reduzido = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduzido) return;
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(".hero__etiqueta", { y: 14, opacity: 0, duration: 0.6 }, 0.1)
        .from(".hero__apoio", { y: 18, opacity: 0, duration: 0.7 }, 0.35)
        .from(
          ".hero__acoes > *",
          { y: 18, opacity: 0, duration: 0.6, stagger: 0.08 },
          0.45,
        )
        .from(
          ".hero__fatia",
          { scale: 1.2, y: 60, opacity: 0, duration: 1.3, ease: "power2.out" },
          0.2,
        );
      gsap.to(".hero__fatia", {
        y: "+=14",
        rotation: "+=1.6",
        duration: 3.6,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
      ScrollTrigger.create({
        trigger: ".hero",
        start: "bottom top",
        onEnter: () => setNoTopo(false),
        onLeaveBack: () => setNoTopo(true),
      });
      ScrollTrigger.batch(".grade .cartao", {
        start: "top 88%",
        once: true,
        onEnter: (lote) =>
          gsap.from(lote, {
            y: 34,
            opacity: 0,
            duration: 0.7,
            stagger: 0.09,
            ease: "power3.out",
          }),
      });

      gsap.utils.toArray(".passo").forEach((passo) => {
        gsap.from(passo, {
          x: -28,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: passo, start: "top 86%", once: true },
        });
      });

      gsap.from(".entrega", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: ".entrega", start: "top 88%", once: true },
      });
      gsap.utils
        .toArray(".secao__cabecalho h2, .casa__texto h2")
        .forEach((titulo) => {
          gsap.from(titulo, {
            y: 26,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: titulo, start: "top 90%", once: true },
          });
        });
    },
    { scope: paginaRef },
  );

  return (
    <div ref={paginaRef}>
      <section className="hero">
        <img
          className="hero__fatia"
          src="/assets/fatia-margherita.png"
          alt=""
          width={1000}
          height={666}
          fetchPriority="high"
        />
        <div className="hero__brasa" aria-hidden="true" />
        {}
        <div className="hero__veu" aria-hidden="true" />

        <div className="wrap hero__interno">
          <p className="hero__etiqueta">
            <IconeChama width={14} height={14} />
            Forno a lenha · Campina Grande
          </p>

          <h1 className="sr-only">Top Pizzas</h1>

          <DepthFlipText
            phrases={[
              "Massa de longa fermentação",
              "Forno a lenha",
              "Entrega rápida",
              "Extrema qualidade",
              "Ingredientes frescos",
            ]}
            loop
            holdDuration={1.1}
            transitionDuration={1.3}
            charStagger={0.018}
            ativo={noTopo}
          />

          <p className="hero__apoio">
            Oferecendo extrema qualidade para satisfazer seu paladar. Mais do
            que uma pizza normal, uma experiência a ser vivida.
          </p>

          <div className="hero__acoes">
            <Link to="/cardapio" className="btn btn--ambar">
              Ver cardápio
              <IconeSeta width={18} height={18} />
            </Link>
            <a href="#a-casa" className="btn btn--linha">
              Nossa conduta
            </a>
          </div>
        </div>
      </section>

      <section className="secao secao--destaques" id="mais-pedidas">
        <div className="wrap">
          <div className="secao__cabecalho">
            <h2>Mais pedidas</h2>
            <Link to="/cardapio" className="secao__atalho">
              Cardápio completo
              <IconeSeta width={16} height={16} />
            </Link>
          </div>

          <div className="grade">
            {destaques.map((produto) => (
              <CartaoProduto
                key={produto.id}
                produto={produto}
                aoEscolher={setSelecionado}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="secao secao--casa" id="a-casa">
        <div className="wrap casa">
          <div className="casa__texto">
            <h2>Nossa conduta</h2>
            <p className="casa__intro">
              Três coisas que levamos a risca para trazer a melhor qualidade e
              sabor possível para tornar o seu dia ainda melhor e muito mais
              especial, um preparo diferenciado, com ingredientes premium e
              fazendo você querer mais a cada mordida
            </p>
          </div>

          <ol className="passos">
            {ETAPAS.map((etapa, i) => (
              <li key={etapa.titulo} className="passo">
                <span className="passo__ordem">{i + 1}</span>
                <div>
                  <h3 className="passo__titulo">{etapa.titulo}</h3>
                  <p className="passo__texto">{etapa.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="secao secao--entrega">
        <div className="wrap entrega">
          <IconeMoto width={38} height={38} />
          <div>
            <h2 className="entrega__titulo">Entregamos em 11 bairros</h2>
            <p className="entrega__texto">
              Catolé, Bodocongó, Centro, Liberdade, Prata, Universitário, José
              Pinheiro, Santa Rosa, Malvinas, Alto Branco e Mirante. Taxa única
              de R$ 8. Retirada na loja sai sem taxa.
            </p>
          </div>
          <Link to="/cardapio" className="btn btn--ambar">
            Começar pedido
          </Link>
        </div>
      </section>

      {selecionado && (
        <ModalProduto
          produto={selecionado}
          aoFechar={() => setSelecionado(null)}
        />
      )}
    </div>
  );
}
