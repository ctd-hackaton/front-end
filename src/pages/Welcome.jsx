import { useState } from "react";
import SignInModal from "../features/SignInModal";
import SignUpModal from "../features/SignUpModal";
import styles from "../css/Welcome.module.css";

function Welcome() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            Meet <span className={styles.highlight}>Chef Jul</span> &{" "}
            <span className={styles.highlight}>Julie</span>
          </h1>
          <p className={styles.subtitle}>
            Your AI-powered culinary companions for personalized meal planning
            and recipe assistance
          </p>

          <div className={styles.cta}>
            <button
              className={styles.primaryBtn}
              onClick={() => setShowSignUp(true)}
            >
              Get Started
            </button>
            <button
              className={styles.secondaryBtn}
              onClick={() => setShowSignIn(true)}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      <div className={styles.features}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>👨‍🍳</div>
          <h3>Chef Jul - Your Meal Planner</h3>
          <p>
            Create personalized weekly meal plans tailored to your dietary
            preferences, allergies, and nutritional goals. Chef Jul considers
            your taste, fitness targets, and favorite cuisines to craft the
            perfect menu.
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>🍳</div>
          <h3>Julie - Your Sous-Chef</h3>
          <p>
            Need to tweak a recipe? Julie helps you modify ingredients, simplify
            cooking steps, adjust portion sizes, and answer any culinary
            questions on the fly.
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>📊</div>
          <h3>Smart Nutrition Tracking</h3>
          <p>
            Track your calories, macros, and nutritional goals with ease. Get
            shopping lists, meal prep tips, and insights to help you stay on
            track.
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>🎯</div>
          <h3>Personalized to You</h3>
          <p>
            Tell us about your dietary restrictions, allergies, activity level,
            and goals. Every meal plan and recipe respects your preferences and
            keeps you safe.
          </p>
        </div>
      </div>

      <div className={styles.howItWorks}>
        <h2>How It Works</h2>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <h4>Create Your Profile</h4>
            <p>Share your dietary preferences, allergies, and fitness goals</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <h4>Chat with Chef Jul</h4>
            <p>Request a personalized weekly meal plan</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <h4>Get Detailed Recipes</h4>
            <p>
              Generate complete recipes with steps, tips, and nutrition info
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>4</div>
            <h4>Ask Julie for Help</h4>
            <p>Modify recipes, get cooking advice, and optimize your meals</p>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <p>Start your culinary journey today! 🌟</p>
        <button
          className={styles.primaryBtn}
          onClick={() => setShowSignUp(true)}
        >
          Create Free Account
        </button>
      </div>

      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
      {showSignUp && <SignUpModal onClose={() => setShowSignUp(false)} />}
    </div>
  );
}

export default Welcome;
