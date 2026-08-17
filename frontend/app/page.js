import Hero from "../components/home/Hero";
import TrustStrip from "../components/home/TrustStrip";
import FeaturedProducts from "../components/home/FeaturedProducts";
import CustomGalleryTeaser from "../components/home/CustomGalleryTeaser";
import AboutTeaser from "../components/home/AboutTeaser";
import ContactCTA from "../components/home/ContactCTA";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <FeaturedProducts />
      <CustomGalleryTeaser />
      <AboutTeaser />
      <ContactCTA />
    </>
  );
}
