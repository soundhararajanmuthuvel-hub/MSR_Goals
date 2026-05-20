let goals = JSON.parse(localStorage.getItem("goals")) || [];

function saveGoals(){
  localStorage.setItem("goals", JSON.stringify(goals));
}

function getGoalIcon(name){

  name = name.toLowerCase();

  if(name.includes("bike")) return "🏍️";
  if(name.includes("car")) return "🚗";
  if(name.includes("trip")) return "✈️";
  if(name.includes("study")) return "🎓";
  if(name.includes("phone")) return "📱";
  if(name.includes("laptop")) return "💻";

  return "🎯";
}

function addGoal(){

  const name = document.getElementById("goalName").value;

  const amount = document.getElementById("goalAmount").value;

  if(name === "" || amount === ""){
    alert("Please enter all fields");
    return;
  }

  goals.push({
    name:name,
    target:Number(amount),
    saved:0
  });

  saveGoals();

  displayGoals();

  document.getElementById("goalName").value = "";

  document.getElementById("goalAmount").value = "";
}

function updateMoney(index,value){

  goals[index].saved += value;

  if(goals[index].saved < 0){
    goals[index].saved = 0;
  }

  if(goals[index].saved > goals[index].target){
    goals[index].saved = goals[index].target;
  }

  saveGoals();

  displayGoals();
}

function deleteGoal(index){

  goals.splice(index,1);

  saveGoals();

  displayGoals();
}

function displayGoals(){

  const goalList = document.getElementById("goalList");

  goalList.innerHTML = "";

  let totalSaved = 0;

  let totalGoal = 0;

  goals.forEach((goal,index)=>{

    totalSaved += goal.saved;

    totalGoal += goal.target;

    const percent = Math.floor(
      (goal.saved / goal.target) * 100
    );

    goalList.innerHTML += `

      <div class="goal-card">

        <div class="goal-top">

          <div class="goal-left">

            <div class="goal-icon">
              ${getGoalIcon(goal.name)}
            </div>

            <div class="goal-info">

              <h3>${goal.name}</h3>

              <p>

                Target: ₹${goal.target}

                •

                Saved: ₹${goal.saved}

                •

                Remaining: ₹${goal.target - goal.saved}

              </p>

            </div>

          </div>

          <div class="actions">

            <button
              class="plus-btn"
              onclick="updateMoney(${index},100)"
            >
              + ₹100
            </button>

            <button
              class="minus-btn"
              onclick="updateMoney(${index},-100)"
            >
              - ₹100
            </button>

            <button
              class="delete-btn"
              onclick="deleteGoal(${index})"
            >
              Delete
            </button>

          </div>

        </div>

        <div class="progress">

          <div
            class="progress-bar"
            style="width:${percent}%"
          >
            ${percent}%
          </div>

        </div>

      </div>

    `;
  });

  const balance = totalGoal - totalSaved;

  document.getElementById("totalSaved").innerHTML = `

    <div style="
      font-size:24px;
      margin-bottom:15px;
    ">
      Saved
    </div>

    <div style="
      font-size:40px;
      font-weight:bold;
      margin-bottom:20px;
    ">
      ₹${totalSaved}
    </div>

    <div style="
      font-size:70px;
      font-weight:bold;
    ">
      ₹${balance}
    </div>

    <div style="
      font-size:28px;
      margin-top:10px;
    ">
      Balance
    </div>

  `;
}

displayGoals();

if("serviceWorker" in navigator){

  window.addEventListener("load",()=>{

    navigator.serviceWorker.register("sw.js");

  });

}