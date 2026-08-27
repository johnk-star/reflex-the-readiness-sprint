const deliveryForm = document.getElementById("deliveryForm");

if (deliveryForm) {

    deliveryForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const customerName =
            document.getElementById("customerName").value.trim();

        const customerPhone =
            document.getElementById("customerPhone").value.trim();

        const address =
            document.getElementById("address").value.trim();

        const itemDescription =
            document.getElementById("itemDescription").value.trim();

        const delivery = {
            id: "DEL-" + Date.now(),
            customerName: customerName,
            customerPhone: customerPhone,
            address: address,
            itemDescription: itemDescription,
            status: "OPEN",
            riderId: null,
            createdAt: new Date().toLocaleString()
        };

        const deliveries =
            JSON.parse(localStorage.getItem("deliveries")) || [];

        deliveries.push(delivery);

        localStorage.setItem(
            "deliveries",
            JSON.stringify(deliveries)
        );

        const message = document.getElementById("message");

        message.textContent =
            "Delivery request created successfully!";

        deliveryForm.reset();

    });

}

const openDeliveriesContainer =
    document.getElementById("openDeliveries");


if (openDeliveriesContainer) {

    function displayOpenDeliveries() {

        const deliveries =
            JSON.parse(localStorage.getItem("deliveries")) || [];

        const openDeliveries =
            deliveries.filter(
                delivery => delivery.status === "OPEN"
            );

        openDeliveriesContainer.innerHTML = "";

        if (openDeliveries.length === 0) {

            openDeliveriesContainer.innerHTML =
                "<p>No open delivery requests.</p>";

            return;
        }

        openDeliveries.forEach(function (delivery) {

            const deliveryCard =
                document.createElement("div");

            deliveryCard.classList.add("delivery-card");

            deliveryCard.innerHTML = `
                <h3>${delivery.id}</h3>

                <p>
                    <strong>Customer:</strong>
                    ${delivery.customerName}
                </p>

                <p>
                    <strong>Phone:</strong>
                    ${delivery.customerPhone}
                </p>

                <p>
                    <strong>Address:</strong>
                    ${delivery.address}
                </p>

                <p>
                    <strong>Item:</strong>
                    ${delivery.itemDescription}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${delivery.status}
                </p>

                <label>
                    Assign Rider:
                </label>

                <select id="rider-${delivery.id}">

                    <option value="">
                        Select a rider
                    </option>

                    <option value="rider-1">
                        Brian
                    </option>

                    <option value="rider-2">
                        Mary
                    </option>

                    <option value="rider-3">
                        Kevin
                    </option>

                </select>

                <button
                    class="assign-btn"
                    data-id="${delivery.id}"
                >
                    Assign Delivery
                </button>
            `;

            openDeliveriesContainer.appendChild(
                deliveryCard
            );

        });

    }


    openDeliveriesContainer.addEventListener(
        "click",
        function (event) {

            if (
                !event.target.classList.contains(
                    "assign-btn"
                )
            ) {
                return;
            }

            const deliveryId =
                event.target.dataset.id;

            const riderSelect =
                document.getElementById(
                    `rider-${deliveryId}`
                );

            const riderId =
                riderSelect.value;


            if (!riderId) {

                alert(
                    "Please select a rider first."
                );

                return;
            }


            const deliveries =
                JSON.parse(
                    localStorage.getItem("deliveries")
                ) || [];


            const delivery =
                deliveries.find(
                    delivery =>
                        delivery.id === deliveryId
                );


            if (delivery) {

                delivery.riderId = riderId;

                delivery.status = "ASSIGNED";


                localStorage.setItem(
                    "deliveries",
                    JSON.stringify(deliveries)
                );


                displayOpenDeliveries();

            }

        }
    );


    displayOpenDeliveries();

}