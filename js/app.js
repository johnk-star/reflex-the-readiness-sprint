const API_BASE_URL = "http://localhost:3000/api";


// ==========================================
// RETAILER
// CREATE DELIVERY REQUEST
// ==========================================

const deliveryForm = document.getElementById("deliveryForm");

if (deliveryForm) {

    deliveryForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const customerName =
            document.getElementById("customerName").value.trim();

        const customerPhone =
            document.getElementById("customerPhone").value.trim();

        const address =
            document.getElementById("address").value.trim();

        const productId =
            Number(document.getElementById("productId").value);

        const quantity =
            Number(document.getElementById("quantity").value);

        const itemDescription =
            document.getElementById("itemDescription").value.trim();

        const message =
            document.getElementById("message");


        // Validate fields

        if (
            !customerName ||
            !customerPhone ||
            !address ||
            !productId ||
            !quantity ||
            !itemDescription
        ) {

            message.textContent =
                "Please fill in all required fields.";

            return;
        }


        // Data expected by the Reflex API

        const delivery = {

            retailer_id: 1,

            customer_name: customerName,

            customer_phone: customerPhone,

            delivery_address: address,

            item_description: itemDescription,

            product_id: productId,

            quantity: quantity,

            created_by: 1

        };


        try {

            message.textContent =
                "Creating delivery request...";


            const response = await fetch(
                `${API_BASE_URL}/deliveries`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(delivery)
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Failed to create delivery"
                );
            }


            message.textContent =
                `Delivery #${data.delivery_id} created successfully!`;


            deliveryForm.reset();


        } catch (error) {

            console.error(
                "Error creating delivery:",
                error
            );

            message.textContent =
                "Unable to create delivery. Please check that the API is running.";
        }

    });

}



// ==========================================
// DISPATCHER
// LOAD REQUESTED DELIVERIES
// ==========================================

const openDeliveriesContainer =
    document.getElementById("openDeliveries");


if (openDeliveriesContainer) {


    async function displayOpenDeliveries() {

        openDeliveriesContainer.innerHTML =
            "<p>Loading delivery requests...</p>";


        try {

            const response = await fetch(
                `${API_BASE_URL}/deliveries?status=REQUESTED`
            );


            const deliveries =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    deliveries.error ||
                    "Failed to load deliveries"
                );
            }


            openDeliveriesContainer.innerHTML = "";


            if (deliveries.length === 0) {

                openDeliveriesContainer.innerHTML =
                    "<p>No open delivery requests.</p>";

                return;
            }


            deliveries.forEach(function (delivery) {

                const deliveryCard =
                    document.createElement("div");

                deliveryCard.classList.add(
                    "delivery-card"
                );


                deliveryCard.innerHTML = `

                    <h3>
                        Delivery #${delivery.delivery_id}
                    </h3>

                    <p>
                        <strong>Customer:</strong>
                        ${delivery.customer_name}
                    </p>

                    <p>
                        <strong>Phone:</strong>
                        ${delivery.customer_phone}
                    </p>

                    <p>
                        <strong>Address:</strong>
                        ${delivery.delivery_address}
                    </p>

                    <p>
                        <strong>Product:</strong>
                        ${delivery.product_name}
                    </p>

                    <p>
                        <strong>Variant:</strong>
                        ${delivery.size_or_variant}
                    </p>

                    <p>
                        <strong>Item:</strong>
                        ${delivery.item_description}
                    </p>

                    <p>
                        <strong>Quantity:</strong>
                        ${delivery.quantity}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${delivery.status}
                    </p>

                    <label
                        for="rider-${delivery.delivery_id}"
                    >
                        Assign Rider:
                    </label>

                    <select
                        id="rider-${delivery.delivery_id}"
                    >

                        <option value="">
                            Select a rider
                        </option>

                        <option value="3">
                            Brian Kamau
                        </option>

                        <option value="4">
                            Faith Wanjiku
                        </option>

                        <option value="5">
                            Kevin Ochieng
                        </option>

                    </select>

                    <button
                        class="assign-btn"
                        data-id="${delivery.delivery_id}"
                    >
                        Assign Delivery
                    </button>
                `;


                openDeliveriesContainer.appendChild(
                    deliveryCard
                );

            });


        } catch (error) {

            console.error(
                "Error loading deliveries:",
                error
            );

            openDeliveriesContainer.innerHTML =
                "<p>Unable to load delivery requests.</p>";
        }

    }



    // ==========================================
    // DISPATCHER
    // ASSIGN RIDER
    // ==========================================

    openDeliveriesContainer.addEventListener(
        "click",
        async function (event) {

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
                Number(riderSelect.value);


            if (!riderId) {

                alert(
                    "Please select a rider first."
                );

                return;
            }


            const assignment = {

                rider_id: riderId,

                assigned_by: 2

            };


            try {

                const response = await fetch(

                    `${API_BASE_URL}/deliveries/${deliveryId}/assign`,

                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify(assignment)
                    }

                );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        "Failed to assign delivery"
                    );
                }


                alert(
                    "Delivery assigned successfully!"
                );


                displayOpenDeliveries();


            } catch (error) {

                console.error(
                    "Error assigning delivery:",
                    error
                );

                alert(
                    error.message ||
                    "Unable to assign delivery."
                );
            }

        }
    );


    displayOpenDeliveries();

}