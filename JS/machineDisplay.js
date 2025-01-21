fetch("https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Machines")
  .then((response) => response.json())
  .then((data) => {
    console.log(data); // בדיקה בקונסול

    const listElement = document.querySelector(".list");

    const machines =
      typeof data.body === "string" ? JSON.parse(data.body) : data.body;

    machines.forEach((machine) => {
      const itemElement = document.createElement("div");
      itemElement.classList.add("item");

      const imageUrl = machine.ImageURL || "default-image.jpg"; // תמונה ברירת מחדל

      itemElement.innerHTML = `
        <img src="${imageUrl}" alt="${machine.Name}" />
        <div class="introduce">
            <div class="title">MACHINE SELECTION</div>
            <div class="topic">${machine.Name}</div>
            <div class="des">${machine.Description}</div>
            <button class="chooseMachine">SELECT MACHINE &#8599;</button>
        </div>
      `;

      listElement.appendChild(itemElement);

      const button = itemElement.querySelector(".chooseMachine");

      if (button) {
        button.addEventListener("click", () => {
          console.log("כפתור נלחץ");

          // יצירת חלון קופץ
          const modal = document.createElement("div");
          modal.classList.add("modal");

          modal.innerHTML = `
            <div class="modal-content">
              <span class="close-button">&times;</span>
              <h2 class="modal-title">${machine.Name}</h2>
              <p class="modal-description">${machine.Description}</p>
              <table class="modal-table">
                <tr><td>Machine Name</td><td>${machine.Name}</td></tr>
                <tr><td>Type</td><td>${machine.Type}</td></tr>
                <tr><td>Brand</td><td>${machine.Brand}</td></tr>
                <tr><td>Target Body Part</td><td>${
                  machine.TargetBodyPart
                }</td></tr>
                <tr><td>Availability</td><td>${
                  machine.Availability === "true"
                    ? "Available"
                    : "Not Available"
                }</td></tr>
              </table>
              <button class="backButton">Back</button>
            </div>
          `;

          document.body.appendChild(modal);

          // הפעלת אנימציה
          setTimeout(() => modal.classList.add("visible"), 10);

          const closeButton = modal.querySelector(".close-button");
          const backButton = modal.querySelector(".backButton");

          const closeModal = () => {
            modal.classList.remove("visible");
            setTimeout(() => modal.remove(), 300);
          };

          closeButton.addEventListener("click", closeModal);
          backButton.addEventListener("click", closeModal);
        });
      }
    });
  })
  .catch((error) => {
    console.error("Error fetching machines:", error);
  });
