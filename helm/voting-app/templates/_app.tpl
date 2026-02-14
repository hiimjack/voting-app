{{/*
Vote - Selector labels
*/}}
{{- define "voting-app.vote.selectorLabels" -}}
app.kubernetes.io/name: {{ include "voting-app.name" . }}-vote
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Vote - Common labels
*/}}
{{- define "voting-app.vote.labels" -}}
helm.sh/chart: {{ include "voting-app.chart" . }}
{{ include "voting-app.vote.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Vote - Create the name of the service account to use
*/}}
{{- define "voting-app.vote.serviceAccountName" -}}
{{- if .Values.vote.serviceAccount.create }}
{{- default (include "voting-app.fullname" .) .Values.vote.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.vote.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Results - Selector labels
*/}}
{{- define "voting-app.results.selectorLabels" -}}
app.kubernetes.io/name: {{ include "voting-app.name" . }}-results
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Results - Common labels
*/}}
{{- define "voting-app.results.labels" -}}
helm.sh/chart: {{ include "voting-app.chart" . }}
{{ include "voting-app.results.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Results - Create the name of the service account to use
*/}}
{{- define "voting-app.results.serviceAccountName" -}}
{{- if .Values.results.serviceAccount.create }}
{{- default (include "voting-app.fullname" .) .Values.results.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.results.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Postgres - Selector labels
*/}}
{{- define "voting-app.postgres.selectorLabels" -}}
app.kubernetes.io/name: {{ include "voting-app.name" . }}-postgres
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Postgres - Common labels
*/}}
{{- define "voting-app.postgres.labels" -}}
helm.sh/chart: {{ include "voting-app.chart" . }}
{{ include "voting-app.postgres.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Postgres - Create the name of the service account to use
*/}}
{{- define "voting-app.postgres.serviceAccountName" -}}
{{- if .Values.postgres.serviceAccount.create }}
{{- default (include "voting-app.fullname" .) .Values.postgres.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.postgres.serviceAccount.name }}
{{- end }}
{{- end }}
