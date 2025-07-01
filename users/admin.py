from django.contrib import admin
from .models import SymposiumRegistration, SymposiumDelegate

class SymposiumDelegateInline(admin.TabularInline):
    model = SymposiumDelegate
    extra = 0


class SymposiumDelegateAdmin(admin.ModelAdmin):
    list_display = ('registration', 'number', 'name', 'age')  # Remove or fix 'class_category'


@admin.register(SymposiumRegistration)
class SymposiumRegistrationAdmin(admin.ModelAdmin):

    list_display = ('user', 'email', 'team_name', 'team_size','ca_name','ca_code','registered_through_ca', 'payment_status', 'total_fee','payment_done','payment_voucher','team_id','accommodation_fee','event1_fee','delegation_fee')
    list_editable = ('payment_status','payment_done','payment_voucher','team_id')
    search_fields = ('email', 'team_name')

    
    
@admin.register(SymposiumDelegate)
class SymposiumDelegateAdmin(admin.ModelAdmin):
    list_display = ("registration", "number", "name", "age", "email", "phone", "accommodation","number_of_nights")
    list_editable = ('number_of_nights',"age")
    from django.contrib import admin
from .models import CampusAmbassador

@admin.register(CampusAmbassador)
class CampusAmbassadorAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'email', 'institution', 'created_at')
    search_fields = ('name', 'code', 'email', 'institution')
