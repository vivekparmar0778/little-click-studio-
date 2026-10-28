import HeroSection from "../Hero/HeroSection";
import ReviewsSection from "../Reviews/ReviewsSection";

export default function HomePage() {
  return (
    <main className="home-page">
      <HeroSection />
      <ReviewsSection />
    </main>
  );
}