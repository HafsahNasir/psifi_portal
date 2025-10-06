from .models import FormState
from django.shortcuts import render, get_object_or_404
from users.models import SymposiumRegistration
from .forms import NamePasswordResetForm  # Adjust path as needed
from .models import CampusAmbassador, SymposiumRegistration
from .models import SymposiumRegistration
import re
from django.http import JsonResponse
from django.utils import timezone
import json
from .models import SymposiumRegistration, SymposiumDelegate
from django.contrib.auth.models import User
from django.http import JsonResponse, HttpResponseForbidden
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render, redirect, get_object_or_404
from users.models import SymposiumRegistration, SymposiumDelegate
from django.db.models import Q
from .forms import CustomSignupForm  # You should create this!
from django.views.decorators.cache import never_cache
from django.contrib import messages
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login
from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.forms import AuthenticationForm
from .forms import CustomSignupForm
from django.contrib.auth.decorators import login_required
from django import forms
from .models import CampusAmbassador, calculate_nights
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.views.decorators.http import require_POST
import os
import requests
from datetime import datetime

try:
    import gspread
    from google.oauth2.service_account import Credentials
except Exception:
    gspread = None
    Credentials = None


def home_view(request):
    return render(request, 'home.html')


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


def dashboard_view(request):
    user_email = request.user.email

    # Check if this user is the head delegate of any registration
    reg = SymposiumRegistration.objects.filter(
        email__iexact=user_email).first()

    has_registration = reg is not None

    # Debugging info
    print("Current user email:", repr(user_email))
    print("All registration emails:", list(
        SymposiumRegistration.objects.values_list("email", flat=True)))
    print("Registration object:", reg)

    return render(request, "dashboard.html", {
        "has_registration": has_registration,
        "reg": reg,
    })


# 1. Embed Tally form (as an iframe in your template)

def register_page(request):
    # If user already has a registration, redirect to info page
    if SymposiumRegistration.objects.filter(user=request.user).exists():
        return redirect('registration_info')
    # Your HTML with the iframe embed
    return render(request, 'embed_cognito.html')


# 2. Webhook to receive Tally responses and save to DB


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
        email = extract("question_lOV1Go_263842fb-8df7-4d40-8586-8d9347c1fe53")
        registration_type = extract_choice_label("question_LKYyZl")
        institution_name = extract("question_poW9b8")
        team_city = extract("question_14v5A1")
        ca_name = extract("question_471aDd")
        ca_code = extract("question_4714Rr")
        team_name = extract("question_MaYyek")
        team_size_label = extract_choice_label("question_JlDY1K")
        team_size = int(re.search(r"\d+", team_size_label).group()
                        ) if team_size_label else 0
        registered_through_ca = (
            registration_type == "Institution" and ca_code not in [None, ""])

        # Preferences (ranking)
        ranking_prefs = []
        for f in fields:
            if f.get("key") == "question_NXY1Pl":
                ranking_prefs = [option["text"] for option in f.get(
                    "options", []) if option["id"] in f.get("value", [])]

        # Prevent duplicate registration
        if SymposiumRegistration.objects.filter(email=email, team_name=team_name).exists():
            return JsonResponse({"detail": "Already registered"}, status=409)
        User = get_user_model()

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

        # --- Save all 5 delegates, null fields if missing ---
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
            # <-- ADD THIS
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
            cnic_val = delegate_data.get("cnic", "")
            # Only create if CNIC is present and non-empty
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
        reg.chaperone_image_url = chaperone_image_val[0]['url'] if (
            chaperone_image_val and isinstance(chaperone_image_val, list)) else None
        reg.chaperone_accommodation = extract_choice_label("question_BpDRNY")

        # --- Undertaking ---
        undertaking_field = extract(
            "question_8L85qz_126d84d5-be88-4806-b7b3-4b1a4e0a1a7a")
        reg.undertaking = bool(undertaking_field)
        print("undertaking")

        # --- Compute fees and save ---
        reg.calculate_accommodation_fee()

        reg.update_fees()
        reg.save()

        print("Received Tally webhook and saved registration & delegates.")
        return JsonResponse({"detail": "Success"}, status=201)

    except Exception as e:
        import traceback
        traceback.print_exc()
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
    return render(request, 'embed_cognito.html')


@login_required
@login_required
@login_required
def payment_voucher_view(request):
    registration = SymposiumRegistration.objects.filter(
        email=request.user.email).first()
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

    return render(request, 'contact.html')


def categories(request):

    return render(request, 'categories.html')


def media(request):

    return render(request, 'lss.html')


def auto(request):

    return render(request, 'auto.html')


def life(request):

    return render(request, 'life.html')


def casignup(request):

    return render(request, 'ca_signup.html')


def aiml(request):

    return render(request, 'aiml.html')


def quantum(request):

    return render(request, 'quantum.html')


def schedule_view(request):
    return render(request, 'schedule.html')


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


@csrf_exempt
def name_password_reset(request):
    if request.method == "POST":
        form = NamePasswordResetForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            first_name = form.cleaned_data['first_name']
            last_name = form.cleaned_data['last_name']
            new_password = form.cleaned_data['new_password1']

            try:
                user = User.objects.get(
                    username=username, first_name=first_name, last_name=last_name)
                user.set_password(new_password)
                user.save()
                messages.success(
                    request, "Password reset successful. You can now log in with your new password.")
                return redirect('login')  # Use your login url name
            except User.DoesNotExist:
                messages.error(request, "No user found with this information.")
    else:
        form = NamePasswordResetForm()
    return render(request, 'name_password_reset.html', {'form': form})


# Form State Management Views


@login_required
@csrf_exempt
def save_form_state(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            form_state, created = FormState.objects.get_or_create(
                user=request.user,
                form_name='psifi_registration',
                defaults={'form_data': data}
            )
            if not created:
                form_state.form_data = data
                form_state.save()

            return JsonResponse({'success': True, 'message': 'Form state saved'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Invalid request method'})


@login_required
def load_form_state(request):
    try:
        form_state = FormState.objects.get(
            user=request.user,
            form_name='psifi_registration'
        )
        response_data = {
            'success': True,
            'data': form_state.form_data,
            'last_updated': form_state.last_updated.isoformat()
        }

        # If we have a Cognito save URL, include it
        if form_state.cognito_save_url:
            response_data['cognito_save_url'] = form_state.cognito_save_url

        return JsonResponse(response_data)
    except FormState.DoesNotExist:
        return JsonResponse({'success': True, 'data': {}})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
@csrf_exempt
def save_cognito_url(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            save_url = data.get('save_url')

            if not save_url:
                return JsonResponse({'success': False, 'error': 'No save URL provided'})

            form_state, created = FormState.objects.get_or_create(
                user=request.user,
                form_name='psifi_registration',
                defaults={'cognito_save_url': save_url}
            )

            if not created:
                form_state.cognito_save_url = save_url
                form_state.save()

            return JsonResponse({'success': True, 'message': 'Cognito save URL stored'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Invalid request method'})


# ---- Paymo PG Integration ----


def _append_payment_to_sheet(row_values):
    """Append a row to Google Sheets if gspread is available."""
    if gspread is None or Credentials is None:
        return False

    # Prefer env var; fallback to provided sheet ID
    spreadsheet_id = os.environ.get(
        'GOOGLE_SHEETS_ID',
        '1HwxsjxTXYtwkHEmEHuLL9WKI8dsUSWTJqGb55MJfzFk'
    )
    service_account_file = os.environ.get(
        'GOOGLE_APPLICATION_CREDENTIALS',
        os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'cognitointegration-474313-0b8da5023027.json'))
    )

    scopes = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
    ]

    print('[Sheets] Using service account file:', service_account_file)
    print('[Sheets] Spreadsheet ID:', spreadsheet_id)
    creds = Credentials.from_service_account_file(service_account_file, scopes=scopes)
    client = gspread.authorize(creds)
    sheet = client.open_by_key(spreadsheet_id).sheet1
    print('[Sheets] Appending row:', row_values)
    sheet.append_row(row_values, value_input_option='USER_ENTERED')
    print('[Sheets] Append successful')
    return True


def _extract_amount_from_entry(entry):
    """Safely extract total amount from Cognito entry payload without regex."""
    if not entry:
        return None

    # Prioritize TotalFee field from Cognito form
    for key in ['TotalFee']:
        if key in entry:
            try:
                val = entry[key]
                if isinstance(val, (int, float)):
                    print('[Amount] Found numeric at key', key, ':', val)
                    return int(val)
                # If it is a string number (no regex): use simple cast after stripping commas
                if isinstance(val, str):
                    cleaned = ''.join([c for c in val if c.isdigit()])
                    print('[Amount] Found string at key', key, 'raw=', val, 'cleaned=', cleaned)
                    return int(cleaned) if cleaned else None
            except Exception:
                pass

    # Fallback to other common patterns
    for key in ['total', 'Total', 'grand_total', 'GrandTotal', 'Grand_Total']:
        if key in entry:
            try:
                val = entry[key]
                if isinstance(val, (int, float)):
                    print('[Amount] Found numeric at key', key, ':', val)
                    return int(val)
                # If it is a string number (no regex): use simple cast after stripping commas
                if isinstance(val, str):
                    cleaned = ''.join([c for c in val if c.isdigit()])
                    print('[Amount] Found string at key', key, 'raw=', val, 'cleaned=', cleaned)
                    return int(cleaned) if cleaned else None
            except Exception:
                pass

    # Sometimes totals live in a nested object like calculations or summary
    for key in ['calculations', 'summary']:
        nested = entry.get(key)
        if isinstance(nested, dict):
            amount = _extract_amount_from_entry(nested)
            if amount is not None:
                return amount

    return None


@csrf_exempt
@require_POST
def create_payment(request):
    """Create a Paymo transaction from Cognito afterSubmit payload and return redirect URL."""
    try:
        body = json.loads(request.body or '{}')
    except Exception:
        return JsonResponse({'detail': 'Invalid JSON'}, status=400)

    # Cognito message structures vary; support a few keys
    entry = body.get('entry') or body.get('data') or body.get('payload') or body
    print('[CreatePayment] Incoming body keys:', list(body.keys()))
    print('[CreatePayment] Entry keys:', list(entry.keys()) if isinstance(entry, dict) else type(entry))
    print('[CreatePayment] Entry TotalFee value:', entry.get('TotalFee') if isinstance(entry, dict) else 'N/A')

    # Support multiple casings/keys from Cognito entry
    email = (
        entry.get('email') or entry.get('Email') or body.get('email') or body.get('Email')
    )
    team_name = (
        entry.get('team_name') or entry.get('teamName') or entry.get('TeamName') or body.get('team_name') or body.get('TeamName')
    )

    # Prefer total from entry, fallback to server-side computed registration total
    amount = _extract_amount_from_entry(entry)
    print('[CreatePayment] Amount extracted:', amount)
    if (amount is None or amount <= 0) and isinstance(body, dict):
        try:
            alt = body.get('amount')
            print('[CreatePayment] body.amount raw:', alt, type(alt))
            if isinstance(alt, (int, float)):
                amount = int(alt)
                print('[CreatePayment] Using amount from body.amount (numeric):', amount)
            elif isinstance(alt, str):
                cleaned = ''.join([c for c in alt if c.isdigit()])
                if cleaned:
                    amount = int(cleaned)
                    print('[CreatePayment] Using amount from body.amount (string cleaned):', amount)
        except Exception:
            pass

    # Find an existing registration by email+team_name if possible
    reg = None
    if email and team_name:
        reg = SymposiumRegistration.objects.filter(email__iexact=email, team_name__iexact=team_name).first()
    elif email:
        reg = SymposiumRegistration.objects.filter(email__iexact=email).order_by('-submitted_at').first()

    if reg and (amount is None or amount <= 0):
        # Ensure fees are up to date
        print('[CreatePayment] Falling back to registration total for', email, team_name)
        reg.update_fees(save=True)
        amount = reg.total_fee or 0
        print('[CreatePayment] Registration total:', amount)

    if not isinstance(amount, int) or amount <= 0:
        return JsonResponse({'detail': 'Missing or invalid amount'}, status=400)

    paymo_base = os.environ.get('PAYMO_BASE_URL', 'https://dev-dot-cardpay-1.el.r.appspot.com')
    paymo_api_key = os.environ.get('PAYMO_API_KEY')
    paymo_api_secret = os.environ.get('PAYMO_API_SECRET')

    if not paymo_api_key or not paymo_api_secret:
        print('[CreatePayment] Missing Paymo credentials in environment')
        return JsonResponse({'detail': 'Server misconfigured: missing Paymo credentials'}, status=500)

    # Callback URL where Paymo will POST completion status
    callback_url = request.build_absolute_uri('/api/paymo/callback/')

    try:
        print('[CreatePayment] Calling Paymo at', f"{paymo_base}/api/v1/paymo-pg/create-transaction")
        resp = requests.post(
            f"{paymo_base}/api/v1/paymo-pg/create-transaction",
            headers={
                'Content-Type': 'application/json',
                'X-API-Key': paymo_api_key,
                'X-API-Secret': paymo_api_secret,
            },
            json={
                'amount': amount,
                'checkout_url': callback_url,
            },
            timeout=20,
        )
        print('[CreatePayment] Paymo response status:', resp.status_code)
        if resp.status_code >= 400:
            print('[CreatePayment] Paymo error body:', resp.text)
            return JsonResponse({'detail': 'Paymo error', 'status': resp.status_code, 'body': resp.text}, status=502)
        data = resp.json()
        print('[CreatePayment] Paymo response JSON:', data)
        # Try multiple shapes: flat, nested under 'data', alternative keys
        redirect_url = (
            data.get('redirect_url') or
            data.get('redirect') or
            data.get('redirectUrl') or
            data.get('payment_url') or
            (data.get('data', {}) if isinstance(data.get('data'), dict) else {}).get('redirect_url') or
            (data.get('data', {}) if isinstance(data.get('data'), dict) else {}).get('redirect') or
            (data.get('data', {}) if isinstance(data.get('data'), dict) else {}).get('redirectUrl')
        )
        if not redirect_url:
            print('[CreatePayment] Missing redirect_url in Paymo response')
            return JsonResponse({'detail': 'Missing redirect_url from Paymo', 'gateway_raw': data}, status=502)

        # Save payment URL to DB for later display
        if reg:
            reg.payment_voucher = redirect_url
            reg.save(update_fields=['payment_voucher'])
            print('[CreatePayment] Saved payment_voucher for registration id:', reg.id)

        # Append to Google Sheets (best-effort)
        try:
            timestamp = datetime.utcnow().isoformat()
            row = [
                email or '',
                team_name or '',
                str(amount),
                redirect_url,
                timestamp,
            ]
            _append_payment_to_sheet(row)
        except Exception:
            import traceback
            print('[Sheets] Append failed')
            traceback.print_exc()

        return JsonResponse({'payment_url': redirect_url})
    except requests.RequestException as e:
        print('[CreatePayment] Network error to Paymo:', str(e))
        return JsonResponse({'detail': 'Network error to Paymo', 'error': str(e)}, status=502)


@csrf_exempt
@require_POST
def paymo_callback(request):
    """Receive Paymo checkout callback with transaction status and update registration."""
    try:
        payload = json.loads(request.body or '{}')
    except Exception:
        payload = {}

    # Expected fields are not specified; try common ones
    status_value = payload.get('status') or payload.get('payment_status')
    email = payload.get('email')
    team_name = payload.get('team_name') or payload.get('teamName')
    redirect_url = payload.get('redirect_url')

    reg = None
    if email and team_name:
        reg = SymposiumRegistration.objects.filter(email__iexact=email, team_name__iexact=team_name).first()
    elif email:
        reg = SymposiumRegistration.objects.filter(email__iexact=email).order_by('-submitted_at').first()

    if reg:
        if status_value and str(status_value).lower() in ['paid', 'success', 'completed']:
            reg.payment_status = 'Paid'
            reg.payment_done = True
            reg.assign_team_id_if_needed(save=False)
        elif status_value and str(status_value).lower() in ['failed', 'error', 'declined']:
            reg.payment_status = 'Failed'
        if redirect_url:
            reg.payment_voucher = redirect_url
        reg.save()

    return JsonResponse({'ok': True})


# ---- Debug utilities ----


@csrf_exempt
@require_POST
def debug_sheets_append(request):
    """Append a test row to Google Sheets to verify credentials and sharing."""
    try:
        body = json.loads(request.body or '{}')
    except Exception:
        return JsonResponse({'detail': 'Invalid JSON'}, status=400)

    email = body.get('email') or ''
    team_name = body.get('team_name') or ''
    amount = body.get('amount') or ''
    payment_url = body.get('payment_url') or 'https://example.com/test'
    timestamp = datetime.utcnow().isoformat()

    row = [str(email), str(team_name), str(amount), str(payment_url), timestamp]
    try:
        print('[Sheets][Debug] Attempting append of row:', row)
        ok = _append_payment_to_sheet(row)
        return JsonResponse({'ok': bool(ok), 'row': row})
    except Exception as e:
        import traceback
        print('[Sheets][Debug] Append failed:', str(e))
        traceback.print_exc()
        return JsonResponse({'ok': False, 'error': str(e)}, status=500)
