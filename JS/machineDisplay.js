document.addEventListener("DOMContentLoaded", function () {
  // קריאה ל-API שלך כדי למשוך את המידע
  fetch("https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Machines")
    .then((response) => response.json()) // המר את התשובה לאובייקט JSON
    .then((data) => {
      const machines = data; // כאן אנחנו מניחים שה-API מחזיר מערך של מכונות
      const listElement = document.querySelector(".list"); // בחר את אלמנט הרשימה

      // עבור על כל מכונה וצרוב אותה לתוך ה-HTML
      machines.forEach((machine) => {
        const itemElement = document.createElement("div");
        itemElement.classList.add("item"); // הוסף את המחלקה 'item' לכל פריט מכונה

        // הכנס את הנתונים מה-API לתוך ה-HTML
        itemElement.innerHTML = `
          <img src="${machine.ImageURL}" alt="${machine.Name}">
          <div class="introduce">
            <div class="title">MACHINE SELECTION</div>
            <div class="topic">${machine.Name}</div>
            <div class="des">${machine.Description}</div>
            <button class="chooseMachine">SELECT MACHINE &#8599</button>
          </div>
          <div class="detail">
            <div class="title">${machine.Name}</div>
            <div class="des">${machine.Description}</div>
            <div class="specifications">
              <div><p>Machine Name</p><p>${machine.Name}</p></div>
              <div><p>Type</p><p>${machine.Type}</p></div>
              <div><p>Brand</p><p>${machine.Brand}</p></div>
              <div><p>Target Body Part</p><p>${machine.TargetBodyPart}</p></div>
              <div><p>Availability</p><p>${machine.Availability}</p></div>
            </div>
            <div class="setworkout">
              <button>Watch Your History</button>
              <button>Set Workout</button>
            </div>
          </div>
        `;

        // הוסף את הפריט החדש לרשימה
        listElement.appendChild(itemElement);
      });
    })
    .catch((error) => console.error("Error fetching data:", error)); // טיפול בשגיאות אם יש
});
