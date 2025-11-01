// Example: How to use SmallChat with props
// This code shows how to pass meal context as props to SmallChat

import SmallChat from "../src/pages/SmallChat";
import mealPlanMock from "./mealPlanMock.json";

function MealPlanView() {
  // Example 1: Editing Monday's breakfast
  const weekNumber = "2025-W44";
  const weekday = "monday";
  const mealType = "breakfast";

  const mealData = mealPlanMock.weekPlan[weekday][mealType];

  return (
    <div>
      <h2>Edit Monday Breakfast</h2>
      <SmallChat
        week={weekNumber}
        day={weekday}
        type={mealType}
        meal={mealData}
      />

      {/* Example 2: Without meal context (general chat) */}
      <h2>General Chat</h2>
      <SmallChat />
    </div>
  );
}

// Example 3: In a router setup
function App() {
  return (
    <Routes>
      <Route path="/smallchat" element={<SmallChat />} />
      <Route
        path="/smallchat/:week/:day/:mealType"
        element={<SmallChatWrapper />}
      />
    </Routes>
  );
}

function SmallChatWrapper() {
  const { week, day, mealType } = useParams();
  // Fetch or load the meal data based on params
  const mealData = getMealData(week, day, mealType);

  return <SmallChat week={week} day={day} type={mealType} meal={mealData} />;
}

export default MealPlanView;
