from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.forms import AuthenticationForm
from .forms import CustomSignupForm
from django.contrib.auth.decorators import login_required
from django import forms
from .models import CampusAmbassador, calculate_nights
from django.contrib.auth.hashers import check_password


def home_view(request):
    return render(request, 'home.html')



from django.contrib.auth import login
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages
from django.shortcuts import render, redirect
from django.views.decorators.cache import never_cache

from .forms import CustomSignupForm  # You should create this!

@never_cache
def signup_view(request):
    if request.method == 'POST':
        form = CustomSignupForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, f"Account created for {user.username}!")
            return redirect('dashboard')
        else:
            messages.error(request, "Please correct the errors below.")
    else:
        form = CustomSignupForm()
    return render(request, 'signup.html', {'form': form})


def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('dashboard')
    else:
        form = AuthenticationForm()
    return render(request, 'login.html', {'form': form})

from users.models import SymposiumRegistration

def dashboard_view(request):
    reg = SymposiumRegistration.objects.filter(email=request.user.email).first()
    has_registration = reg is not None
    return render(request, "dashboard.html", {
        "has_registration": has_registration,
        "reg": reg,
    })

from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponseForbidden
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from .models import SymposiumRegistration, SymposiumDelegate
import json
from django.utils import timezone

# 1. Embed Tally form (as an iframe in your template)
def register_page(request):
    # If user already has a registration, redirect to info page
    if SymposiumRegistration.objects.filter(user=request.user).exists():
        return redirect('registration_info')
    return render(request, 'embed_tally.html')  # Your HTML with the iframe embed

# 2. Webhook to receive Tally responses and save to DB
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.utils import timezone
from .models import SymposiumRegistration, SymposiumDelegate
import json

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.utils import timezone
import json

from .models import SymposiumRegistration, SymposiumDelegate

from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
import json
from .models import SymposiumRegistration, SymposiumDelegate

from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.http import JsonResponse
import json

from .models import SymposiumRegistration, SymposiumDelegate
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.utils import timezone
import json
import re

from .models import SymposiumRegistration, SymposiumDelegate

import json
import re
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from .models import SymposiumRegistration, SymposiumDelegate

@csrf_exempt
def tally_webhook(request):
    import re
    if request.method != "POST":
        return JsonResponse({"detail": "Only POST allowed"}, status=405)

    try:
        import json
        from django.utils import timezone
        data = json.loads(request.body)
        fields = data.get("data", {}).get("fields", [])

        def extract(key):
            for f in fields:
                if f.get("key") == key:
                    return f.get("value")
            return None

        def extract_choice_label(key):
            for f in fields:
                if f.get("key") == key and f.get("options"):
                    val = f.get("value")
                    if val and len(val) > 0:
                        for option in f["options"]:
                            if option["id"] == val[0]:
                                return option["text"]
            return None

        # Registration fields
        email=request.user.email
        registration_type = extract_choice_label("question_LKYyZl")
        institution_name = extract("question_poW9b8")
        team_city = extract("question_14v5A1")
        ca_name = extract("question_471aDd")
        ca_code = extract("question_4714Rr")
        team_name = extract("question_MaYyek")
        team_size_label = extract_choice_label("question_JlDY1K")
        team_size = int(re.search(r"\d+", team_size_label).group()) if team_size_label else 0
        registered_through_ca = (registration_type == "Institution" and ca_code not in [None, ""])


        # Preferences (ranking)
        ranking_prefs = []
        for f in fields:
            if f.get("key") == "question_NXY1Pl":
                ranking_prefs = [option["text"] for option in f.get("options", []) if option["id"] in f.get("value", [])]

        # Prevent duplicate registration
        if SymposiumRegistration.objects.filter(email=email, team_name=team_name).exists():
            return JsonResponse({"detail": "Already registered"}, status=409)

        reg = SymposiumRegistration.objects.create(
            email=email,
            registration_type=registration_type,
            institution_name=institution_name,
            city=team_city,
            team_name=team_name,
            team_size=team_size,
            preferences={"ranking": ranking_prefs},
            submitted_at=timezone.now(),
        )

        # --- Delegate field keys for all 5 slots ---
        delegate_keys = [
            {
                "name": "question_y4vkXX",
                "age": "question_XoYy5L",
                "email": "question_8L85Nz",
                "phone": "question_08v5VB",
                "cnic": "question_zMJvEM",
                "institution_name": "question_59v5XZ",
                "city": "question_d0jVbd",
                "education_level": "question_YGYyjW",
                "image_url": "question_DpDyqN",
                "accommodation": "question_RoYNVP",
                "date_of_arrival": "question_rO04dp",
                "date_of_departure": "question_4716od",
                
                
            },
            {
                "name": "question_lOWZaN",
                "age": "question_RoYlW4",
                "email": "question_oRdQ9O",
                "phone": "question_GpDyeL",
                "cnic": "question_OXYyQY",
                "institution_name": "question_VPYypM",
                "city": "question_P9YyRB",
                "education_level": "question_ElDYqB",
                "image_url": "question_rOLWD2",
                "accommodation": "question_poW29B",
                "date_of_arrival": "question_jo0R7Y",
                "date_of_departure": "question_2AbWJg",             
            },
            {
                "name": "question_47vdaA",
                "age": "question_joW2eJ",
                "email": "question_2Av5jD",
                "phone": "question_xDyBVv",
                "cnic": "question_ZOYy9e",
                "institution_name": "question_NXYyqO",
                "city": "question_qGWe5g",
                "education_level": "question_QRYyoX",
                "image_url": "question_9Zv5N5",
                "accommodation": "question_14va5l",
                "date_of_arrival": "question_xD0qPE",
                "date_of_departure": "question_ZOG7zA",                 
            },
            {
                "name": "question_y4vpqx",
                "age": "question_XoYvBY",
                "email": "question_8L8gpP",
                "phone": "question_08vgjj",
                "cnic": "question_zMJRQ0",
                "institution_name": "question_59vgqE",
                "city": "question_d0j42K",
                "education_level": "question_YGYKzJ",
                "image_url": "question_DpDEvZ",
                "accommodation": "question_MaYxyA",
                "date_of_arrival": "question_NX4jJN",
                "date_of_departure": "question_qGYrK8",  
            },
            {
                "name": "question_lOW9lv",
                "age": "question_RoY6Bj",
                "email": "question_oRdaVx",
                "phone": "question_GpDjBk",
                "cnic": "question_OXYeBg",
                "institution_name": "question_VPYB1y",
                "city": "question_P9YWBe",
                "education_level": "question_ElDrbr",
                "image_url": "question_rOLbrR",
                "accommodation": "question_JlD4YR",
                "date_of_arrival": "question_QRxZJl",
                "date_of_departure": "question_9Z6kEK",  
            },
        ]

        for i in range(5):
            dkeys = delegate_keys[i]
            delegate_data = {
                "registration": reg,
                "number": i + 1,
            }
            arrival_val = extract(dkeys.get("date_of_arrival"))
            departure_val = extract(dkeys.get("date_of_departure"))
            number_of_nights = calculate_nights(arrival_val, departure_val)
            delegate_data["date_of_arrival"] = arrival_val
            delegate_data["date_of_departure"] = departure_val
            delegate_data["number_of_nights"] = number_of_nights

            for field, qkey in dkeys.items():
                if field in ["date_of_arrival", "date_of_departure", "number_of_nights"]:
                    continue
                val = extract(qkey)
                if field == "image_url" and val and isinstance(val, list):
                    delegate_data[field] = val[0]["url"]
                elif field in ["education_level", "accommodation"]:
                    delegate_data[field] = extract_choice_label(qkey)
                else:
                    delegate_data[field] = val

            # --- Only save delegate if CNIC is present and not empty ---
            cnic_val = delegate_data.get("cnic", "")
            if cnic_val and str(cnic_val).strip():
                SymposiumDelegate.objects.create(**delegate_data)

        # --- Chaperone fields ---
        reg.chaperone_name = extract("question_er2X4o")
        reg.chaperone_cnic = extract("question_WRY7yQ")
        reg.chaperone_mobile = extract("question_a4EMVy")
        reg.chaperone_email = extract("question_6KvBo5")
        reg.chaperone_relationship = extract("question_7KvkGz")
        reg.chaperone_designation = extract("question_berJPE")
        chaperone_image_val = extract("question_ApDXZN")
        reg.chaperone_image_url = chaperone_image_val[0]['url'] if (chaperone_image_val and isinstance(chaperone_image_val, list)) else None
        reg.chaperone_accommodation = extract_choice_label("question_BpDRNY")

        # --- Undertaking ---
        undertaking_field = extract("question_8L85qz_126d84d5-be88-4806-b7b3-4b1a4e0a1a7a")
        reg.undertaking = bool(undertaking_field)
        print("undertaking")

        # --- Compute fees and save ---
        reg.calculate_accommodation_fee()
        reg.calculate_total_fee()
        reg.save()

        print("Received Tally webhook and saved registration & delegates.")
        return JsonResponse({"detail": "Success"}, status=201)

    except Exception as e:
        import traceback; traceback.print_exc()
        return JsonResponse({"detail": str(e)}, status=500)







# 3. Show registration info to user
@login_required
def registration_info(request):
    reg = get_object_or_404(SymposiumRegistration, user=request.user)
    delegates = reg.delegates.all()
    return render(request, 'registration_info.html', {'registration': reg, 'delegates': delegates})
@login_required
def register_page(request):
    # Optionally prevent multiple registrations here
    # ...
    return render(request, 'embed_tally.html')
from django.shortcuts import render, get_object_or_404
from .models import SymposiumRegistration

@login_required
@login_required
@login_required
def payment_voucher_view(request):
    registration = SymposiumRegistration.objects.filter(email=request.user.email).first()
    if not registration:
        return redirect('register_page')

    # If payment voucher is pending, always update fees
    if not registration.payment_done:
        registration.update_fees(save=True)
        print("updates")
    else:

        registration.assign_team_id_if_needed(save=True)
        print("Assigned")

    context = {
        "registration": registration,
        # ... other context ...
    }
    return render(request, "payment_status.html", context)



def team_detail_view(request, pk):
    reg = get_object_or_404(SymposiumRegistration, id=pk)
    delegates = SymposiumDelegate.objects.filter(registration=reg)

    if not delegates.exists():
        delegates = SymposiumDelegate.objects.filter(email=reg.email)
        # Or: SymposiumDelegate.objects.filter(team_name=reg.team_name)

    return render(request, 'team_detail.html', {
        'reg': reg,
        'delegates': delegates,
    })

def custom_logout_view(request):
    logout(request)  # Logs out the user
    return redirect('home') 

def contact(request):

    return render(request,'contact.html') 

def categories(request):

    return render(request,'categories.html') 

def media(request):

    return render(request,'lss.html') 
def auto(request):

    return render(request,'auto.html') 
def life(request):

    return render(request,'life.html') 
def casignup(request):

    return render(request,'ca_signup.html') 
def aiml(request):

    return render(request,'aiml.html') 
def quantum(request):

    return render(request,'quantum.html') 
from django.shortcuts import render, redirect, get_object_or_404
from .models import CampusAmbassador, SymposiumRegistration

def cadashboard(request):
    # 1. Check login/session
    ca_id = request.session.get('ca_id')
    if not ca_id:
        return redirect('ca_login')
    
    # 2. Get CA from db
    ca = get_object_or_404(CampusAmbassador, id=ca_id)
    
    # 3. Get teams with the same CA code (case-insensitive match)
    teams = SymposiumRegistration.objects.filter(ca_code__iexact=ca.code)
    
    # 4. You can calculate stats here
    total_teams = teams.count()

    
    # 5. Pass everything to template
    return render(request, "ca_dashboard.html", {
        'ca': ca,
        'teams': teams,
        'total_teams': total_teams,

    })





def ca_login_view(request):
    error = None
    if request.method == "POST":
        code = request.POST.get('code')
        password = request.POST.get('password')
        try:
            ca = CampusAmbassador.objects.get(code=code)
            if password == ca.password:  # Simple string comparison
                request.session['ca_id'] = ca.id
                return redirect('ca')  # Change 'ca' as needed
            else:
                error = "Incorrect password."
        except CampusAmbassador.DoesNotExist:
            error = "Code not found."
    return render(request, "ca_login.html", {"error": error})
