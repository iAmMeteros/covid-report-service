from django.shortcuts import render, redirect, HttpResponse
from django.contrib.auth.decorators import login_required
from ReportCore.models import Report
from datetime import datetime
import requests
import json
import pprint


def indexView(request):
    return render(request, 'index.html')


@login_required
def reportCreate(request):
    if request.method == "GET":
        return render(request, 'reportCreate.html')
    else:
        has_result = request.POST['has_result_h'] == "true"
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
            if lastReport.reportTime == datetime.now().date():
                lastReport.symptoms = symptoms
                lastReport.status = status
                lastReport.contact = contacts
                lastReport.places = places
                lastReport.reportTime = datetime.now()
                lastReport.save()
                return render(request, "successreport.html")
            else:
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
        return render(request, "successreport.html")


def mapView(request):
    try:
        date = datetime.strptime(request.GET['date'], '%Y-%m-%d').date()
    except:
        date = datetime.now().date()
    if date == datetime.now().date():
        reports = Report.objects.filter(
            reportEndTime__isnull=True, reportTime__lte=date).exclude(status="N").values('places', 'status')
        reports2 = []
    else:
        reports = Report.objects.filter(
            reportTime__lte=date, reportEndTime__gt=date).exclude(status="N").values('places', 'status')
        reports2 = Report.objects.filter(
            reportTime__lte=date, reportEndTime__isnull=True).exclude(status="N").values('places', 'status')
    coords = []
    reports = list(reports) + list(reports2)
    for i in reports:
        if i['status'] == "P":
            status = 1
        else:
            status = 0
        i = i['places']
        if i != '':
            for j in i.split(';'):
                c = [float(l) for l in j.split(',')]
                c.append(status)
                coords.append(c)
    print(coords)
    return render(request, 'map.html', {'coords': coords, 'date': date.strftime('%Y-%m-%d')})


def radarView(request):
    return render(request, 'radar.html')


def getPlaces(request):
    lat = request.GET['lat']
    lng = request.GET['lng']

    r = requests.post('http://altergeo.ru/openapi/v1/places/search', data={'lat': str(lat), 'lng': str(
        lng), 'distance': '50', 'place_types': '3,4,5,6,9,12,23'}, headers={"Accept": "application/json"})
    r = json.loads(r.text)
    try:
        if r['error'] == 'Места не найдены':
            answer = {
                "status": "notfound",
                "danger": 0
            }
        elif r['error'] == 'Превышен лимит запросов':
            answer = {
                "status": "apilimit"
            }
    except:
        places = {
            3: 'Госорганы',  # Госорганы
            4: 'Кафе, бары и рестораны',  # Кафе, бары и рестораны
            5: 'Здоровье и медицина',  # Здоровье и медицина
            6: 'Магазины',  # Магазины
            12: 'Банки',  # Банки
            23: 'Гостиницы'  # Гостиницы
        }
        answer = {
            "status": "success",
            "places": [],
            "danger": 1
        }
        count = 0
        for place in r['places'].values():
            try:
                identity = list(place.values())[0]['type']['id']
                if identity in places.keys():
                    count += 1
                    if places[identity] not in answer['places']:
                        answer['places'].append(places[identity])
            except:
                pass
            if count > 3:
                answer['danger'] = 3
            else:
                answer['danger'] = 2
    return HttpResponse(json.dumps(answer))
