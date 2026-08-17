import Container from "./Container";

const backgroundClasses = {
  navy: "bg-navy text-offwhite",
  offwhite: "bg-offwhite text-ink",
  offwhite2: "bg-offwhite2 text-ink",
  transparent: "bg-transparent text-ink",
};

export default function Section({
  children,
  background = "transparent",
  className = "",
  containerClassName = "",
}) {
  return (
    <section
      className={`py-12 sm:py-16 lg:py-24 ${backgroundClasses[background] || backgroundClasses.transparent} ${className}`.trim()}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
