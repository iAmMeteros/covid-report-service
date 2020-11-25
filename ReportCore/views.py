from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from ReportCore.models import Report
from datetime import datetime

@login_required
def reportCreate(request):
    if request.method == "GET":
        return render(request, 'reportCreate.html')
    else:
        has_result = request.POST['has_result'] == 'y'
        if has_result:
            test_result = request.POST['test_result'] == 'p'
            if test_result:
                status = 'P'
            else:
                status = 'N'
        else:
            status = 'W'
        contacts = request.POST['contacts']
        symptoms = request.POST['symptomsStr']
        places = request.POST['places']
        try:
            lastReport = Report.objects.get(id=int(request.user.last_report))
            lastReport.reportEndTime = datetime.now()
            lastReport.save()
        except:
            pass
        report = Report(
            user=request.user,
            symptoms=symptoms,
            status=status,
            contact=contacts,
            places=places
        )
        report.save()
        request.user.last_report = report.id
        request.user.save()
        return redirect('/report/')