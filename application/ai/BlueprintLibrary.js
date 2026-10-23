class BlueprintLibrary {

    constructor() {

        this.blueprints = {
            restaurant: {
                topic: "restaurant",
                pages: [
                    {
                        name: "Home",
                        isHomepage: true,
                        components: [
                            { type: "heading", level: "h1", content: "Welcome to Gourmet Dining" },
                            { type: "paragraph", content: "Experience exquisite culinary flavors, farm-fresh ingredients, and warm hospitality." },
                            { type: "button", content: "View Menu" },
                            { type: "image", content: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80", alt: "Restaurant Interior" }
                        ]
                    },
                    {
                        name: "Menu",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Our Gourmet Menu" },
                            { type: "paragraph", content: "Explore our chef's hand-crafted seasonal dishes and artisanal beverage selections." },
                            { type: "image", content: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80", alt: "Menu Dish" }
                        ]
                    },
                    {
                        name: "About",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Our Culinary Story" },
                            { type: "paragraph", content: "Founded with a passion for bringing people together over memorable meals." },
                            { type: "image", content: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80", alt: "Chef at Work" }
                        ]
                    },
                    {
                        name: "Reservations",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Reserve Your Table" },
                            { type: "paragraph", content: "Join us for lunch or dinner. Call us or make a reservation online." },
                            { type: "button", content: "Book Reservation" }
                        ]
                    },
                    {
                        name: "Contact",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Contact Us" },
                            { type: "paragraph", content: "Have questions or special catering requests? Get in touch with our team." },
                            { type: "button", content: "Send Message" }
                        ]
                    }
                ]
            },
            saas: {
                topic: "saas",
                pages: [
                    {
                        name: "Home",
                        isHomepage: true,
                        components: [
                            { type: "heading", level: "h1", content: "Scale Your Business Platform" },
                            { type: "paragraph", content: "The modern all-in-one software platform for teams to automate workflows." },
                            { type: "button", content: "Start Free Trial" },
                            { type: "image", content: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80", alt: "SaaS Dashboard" }
                        ]
                    },
                    {
                        name: "Pricing",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Simple, Transparent Pricing" },
                            { type: "paragraph", content: "Choose the plan that fits your business needs. No hidden fees." },
                            { type: "button", content: "Choose Plan" }
                        ]
                    },
                    {
                        name: "Features",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Powerful Features Built for Growth" },
                            { type: "paragraph", content: "Analytics, integrations, automation, and real-time collaboration tools." },
                            { type: "image", content: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80", alt: "Analytics Feature" }
                        ]
                    },
                    {
                        name: "FAQ",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Frequently Asked Questions" },
                            { type: "paragraph", content: "Find answers to common questions about setting up and using our platform." }
                        ]
                    },
                    {
                        name: "Contact",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Talk to Sales & Support" },
                            { type: "paragraph", content: "Our dedicated support team is here to help you 24/7." },
                            { type: "button", content: "Contact Support" }
                        ]
                    }
                ]
            },
            portfolio: {
                topic: "portfolio",
                pages: [
                    {
                        name: "Home",
                        isHomepage: true,
                        components: [
                            { type: "heading", level: "h1", content: "Welcome to My Creative Portfolio" },
                            { type: "paragraph", content: "Showcasing creative projects, design work, and software solutions." },
                            { type: "button", content: "View Work" },
                            { type: "image", content: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80", alt: "Portfolio Hero" }
                        ]
                    },
                    {
                        name: "Projects",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Featured Work & Case Studies" },
                            { type: "paragraph", content: "A curated collection of recent design and development projects." },
                            { type: "image", content: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80", alt: "Projects Grid" }
                        ]
                    },
                    {
                        name: "About",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "About My Journey" },
                            { type: "paragraph", content: "A passionate designer and developer with over 5 years of industry experience." },
                            { type: "image", content: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80", alt: "Creator Bio" }
                        ]
                    },
                    {
                        name: "Contact",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Get in Touch" },
                            { type: "paragraph", content: "Interested in working together? Send me a message!" },
                            { type: "button", content: "Send Email" }
                        ]
                    }
                ]
            },
            agency: {
                topic: "agency",
                pages: [
                    {
                        name: "Home",
                        isHomepage: true,
                        components: [
                            { type: "heading", level: "h1", content: "Digital Agency Solutions" },
                            { type: "paragraph", content: "We help brands grow through digital design, web applications, and marketing." },
                            { type: "button", content: "Our Services" },
                            { type: "image", content: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80", alt: "Agency Team" }
                        ]
                    },
                    {
                        name: "Services",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Our Specialized Services" },
                            { type: "paragraph", content: "Web development, branding, digital marketing, and UI/UX strategy." },
                            { type: "button", content: "Explore Services" }
                        ]
                    },
                    {
                        name: "Portfolio",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Client Case Studies" },
                            { type: "paragraph", content: "See how we transformed brands and increased conversions." },
                            { type: "image", content: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80", alt: "Client Work" }
                        ]
                    },
                    {
                        name: "About",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "About Our Agency" },
                            { type: "paragraph", content: "A collective of strategists, engineers, and creatives." },
                            { type: "image", content: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80", alt: "Office Culture" }
                        ]
                    },
                    {
                        name: "Contact",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Start Your Project" },
                            { type: "paragraph", content: "Let's build something extraordinary together." },
                            { type: "button", content: "Schedule Consultation" }
                        ]
                    }
                ]
            },
            barber: {
                topic: "barber",
                pages: [
                    {
                        name: "Home",
                        isHomepage: true,
                        components: [
                            { type: "heading", level: "h1", content: "Classic Barber Shop & Grooming" },
                            { type: "paragraph", content: "Premium haircuts, beard styling, and hot towel shaves for gentlemen." },
                            { type: "button", content: "Book Appointment" },
                            { type: "image", content: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80", alt: "Barber Chair" }
                        ]
                    },
                    {
                        name: "Services",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Barbering & Grooming Services" },
                            { type: "paragraph", content: "Precision haircuts, beard trims, razor shaves, and scalp treatments." },
                            { type: "button", content: "View Service Pricing" }
                        ]
                    },
                    {
                        name: "Barbers",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Meet Our Master Barbers" },
                            { type: "paragraph", content: "Experienced craftsmen dedicated to keeping you looking sharp." },
                            { type: "image", content: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80", alt: "Barber Team" }
                        ]
                    },
                    {
                        name: "Appointments",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Schedule Your Visit" },
                            { type: "paragraph", content: "Book your appointment online or walk in during business hours." },
                            { type: "button", content: "Book Online Now" }
                        ]
                    },
                    {
                        name: "Contact",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Find Our Shop" },
                            { type: "paragraph", content: "Located in the heart of downtown. Open Tuesday through Saturday." },
                            { type: "button", content: "Get Directions" }
                        ]
                    }
                ]
            },
            realestate: {
                topic: "realestate",
                pages: [
                    {
                        name: "Home",
                        isHomepage: true,
                        components: [
                            { type: "heading", level: "h1", content: "Find Your Dream Home" },
                            { type: "paragraph", content: "Discover luxury residential properties, modern apartments, and prime estates." },
                            { type: "button", content: "Browse Listings" },
                            { type: "image", content: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80", alt: "Luxury Residence" }
                        ]
                    },
                    {
                        name: "Listings",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Featured Properties for Sale" },
                            { type: "paragraph", content: "Explore verified home listings with full specs, photos, and virtual tours." },
                            { type: "image", content: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80", alt: "Property Showcase" }
                        ]
                    },
                    {
                        name: "Agents",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Our Real Estate Experts" },
                            { type: "paragraph", content: "Licensed brokers and market specialists ready to guide your purchase." },
                            { type: "image", content: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80", alt: "Real Estate Agent" }
                        ]
                    },
                    {
                        name: "About",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "About Our Brokerage" },
                            { type: "paragraph", content: "Over 15 years of trusted real estate excellence in property sales and buying." }
                        ]
                    },
                    {
                        name: "Contact",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Contact an Agent" },
                            { type: "paragraph", content: "Schedule a private home showing or property valuation consultation." },
                            { type: "button", content: "Request Showing" }
                        ]
                    }
                ]
            },
            gym: {
                topic: "gym",
                pages: [
                    {
                        name: "Home",
                        isHomepage: true,
                        components: [
                            { type: "heading", level: "h1", content: "Transform Your Fitness Journey" },
                            { type: "paragraph", content: "State-of-the-art equipment, group fitness classes, and expert personal training." },
                            { type: "button", content: "Claim Free Pass" },
                            { type: "image", content: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80", alt: "Gym Floor" }
                        ]
                    },
                    {
                        name: "Classes",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Group Fitness Classes" },
                            { type: "paragraph", content: "HIIT, Yoga, CrossFit, Cycling, and Strength Training for all skill levels." },
                            { type: "image", content: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80", alt: "Group Workout" }
                        ]
                    },
                    {
                        name: "Trainers",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Certified Personal Trainers" },
                            { type: "paragraph", content: "Work 1-on-1 with dedicated coaches to reach your strength and weight goals." },
                            { type: "image", content: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80", alt: "Fitness Coach" }
                        ]
                    },
                    {
                        name: "Membership",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Flexible Gym Memberships" },
                            { type: "paragraph", content: "No contracts. Monthly plans with 24/7 access and guest passes included." },
                            { type: "button", content: "Join Today" }
                        ]
                    },
                    {
                        name: "Contact",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Visit Our Gym" },
                            { type: "paragraph", content: "Drop in for a tour or contact us for membership details." },
                            { type: "button", content: "Get Gym Pass" }
                        ]
                    }
                ]
            },
            medical: {
                topic: "medical",
                pages: [
                    {
                        name: "Home",
                        isHomepage: true,
                        components: [
                            { type: "heading", level: "h1", content: "Compassionate Healthcare & Medical Care" },
                            { type: "paragraph", content: "Comprehensive medical services, expert physicians, and patient-first treatment." },
                            { type: "button", content: "Book Appointment" },
                            { type: "image", content: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80", alt: "Medical Clinic" }
                        ]
                    },
                    {
                        name: "Services",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Our Medical Specialties" },
                            { type: "paragraph", content: "Primary care, cardiology, pediatrics, wellness exams, and diagnostics." },
                            { type: "image", content: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80", alt: "Medical Equipment" }
                        ]
                    },
                    {
                        name: "Doctors",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Our Expert Physicians" },
                            { type: "paragraph", content: "Board-certified doctors committed to providing high quality healthcare." },
                            { type: "image", content: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80", alt: "Doctor Portrait" }
                        ]
                    },
                    {
                        name: "Appointments",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Schedule an Appointment" },
                            { type: "paragraph", content: "Convenient online booking for routine checkups or specialist consultations." },
                            { type: "button", content: "Schedule Visit" }
                        ]
                    },
                    {
                        name: "Contact",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Clinic Location & Hours" },
                            { type: "paragraph", content: "Emergency care and office contact numbers for quick medical support." },
                            { type: "button", content: "Call Clinic" }
                        ]
                    }
                ]
            },
            lawfirm: {
                topic: "lawfirm",
                pages: [
                    {
                        name: "Home",
                        isHomepage: true,
                        components: [
                            { type: "heading", level: "h1", content: "Trusted Legal Representation & Advocacy" },
                            { type: "paragraph", content: "Dedicated attorneys providing strategic counsel in corporate law and litigation." },
                            { type: "button", content: "Free Legal Consultation" },
                            { type: "image", content: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80", alt: "Law Firm Gavel" }
                        ]
                    },
                    {
                        name: "Practice Areas",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Our Legal Practice Areas" },
                            { type: "paragraph", content: "Corporate law, intellectual property, civil litigation, and estate planning." },
                            { type: "button", content: "View All Practices" }
                        ]
                    },
                    {
                        name: "Attorneys",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Experienced Trial Lawyers & Partners" },
                            { type: "paragraph", content: "Accomplished legal professionals fighting for your rights and business interests." },
                            { type: "image", content: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80", alt: "Attorney Portrait" }
                        ]
                    },
                    {
                        name: "About",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "About Our Law Firm" },
                            { type: "paragraph", content: "Over 20 years of proven courtroom success and client advocacy." }
                        ]
                    },
                    {
                        name: "Contact",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Schedule Your Case Review" },
                            { type: "paragraph", content: "Speak directly with a senior partner about your legal situation." },
                            { type: "button", content: "Request Consultation" }
                        ]
                    }
                ]
            },
            general: {
                topic: "general",
                pages: [
                    {
                        name: "Home",
                        isHomepage: true,
                        components: [
                            { type: "heading", level: "h1", content: "Welcome to Our Website" },
                            { type: "paragraph", content: "Building high quality, modern digital experiences." },
                            { type: "button", content: "Explore More" },
                            { type: "image", content: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80", alt: "Hero Banner" }
                        ]
                    },
                    {
                        name: "About",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "About Us" },
                            { type: "paragraph", content: "Learn more about our mission, vision, and core values." },
                            { type: "image", content: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80", alt: "About Banner" }
                        ]
                    },
                    {
                        name: "Contact",
                        isHomepage: false,
                        components: [
                            { type: "heading", level: "h1", content: "Contact Us" },
                            { type: "paragraph", content: "Have questions? We would love to hear from you." },
                            { type: "button", content: "Submit Request" }
                        ]
                    }
                ]
            }
        };

    }

    getBlueprint(topicKey = "general", projectName = "Generated Project") {

        const key = (topicKey || "general").toLowerCase().replace(/[^a-z0-9]/g, "");

        let template = this.blueprints[key];

        if (!template) {

            if (key.includes("realestate") || key.includes("property") || key.includes("home")) {

                template = this.blueprints.realestate;

            } else if (key.includes("law") || key.includes("legal") || key.includes("attorney")) {

                template = this.blueprints.lawfirm;

            } else if (key.includes("gym") || key.includes("fitness") || key.includes("workout")) {

                template = this.blueprints.gym;

            } else if (key.includes("med") || key.includes("doctor") || key.includes("health")) {

                template = this.blueprints.medical;

            } else if (key.includes("barber") || key.includes("hair") || key.includes("salon")) {

                template = this.blueprints.barber;

            } else {

                template = this.blueprints.general;

            }

        }

        // Return clean deep clone customized for projectName
        const customizedPages = template.pages.map(page => ({
            name: page.name,
            isHomepage: page.isHomepage,
            components: page.components.map(comp => {

                let content = comp.content || "";

                if (comp.type === "heading" && page.isHomepage) {

                    content = comp.content.includes("Welcome to") ? `Welcome to ${projectName}` : comp.content;

                }

                return {
                    type: comp.type,
                    level: comp.level || "h1",
                    content,
                    alt: comp.alt || `${page.name} Image`
                };

            })
        }));

        return {
            projectName,
            topic: template.topic,
            pages: customizedPages
        };

    }

}

module.exports = BlueprintLibrary;
