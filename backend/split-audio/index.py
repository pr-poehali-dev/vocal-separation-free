import json
import os
import base64
import tempfile
import subprocess
import boto3
import uuid
from pathlib import Path

def handler(event: dict, context) -> dict:
    """Разделяет аудиофайл на вокал и минус через Demucs, сохраняет в S3 и возвращает ссылки для скачивания."""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    body = json.loads(event.get('body') or '{}')
    file_b64 = body.get('file')
    filename = body.get('filename', 'track.mp3')
    track_name = Path(filename).stem

    if not file_b64:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Файл не передан'})
        }

    file_data = base64.b64decode(file_b64)
    job_id = str(uuid.uuid4())[:8]

    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = os.path.join(tmpdir, filename)
        with open(input_path, 'wb') as f:
            f.write(file_data)

        output_dir = os.path.join(tmpdir, 'output')
        os.makedirs(output_dir, exist_ok=True)

        subprocess.run([
            'python', '-m', 'demucs',
            '--two-stems', 'vocals',
            '--out', output_dir,
            input_path
        ], check=True, capture_output=True)

        model_dir = os.path.join(output_dir, 'htdemucs', track_name)
        vocal_path = os.path.join(model_dir, 'vocals.wav')
        no_vocal_path = os.path.join(model_dir, 'no_vocals.wav')

        s3 = boto3.client(
            's3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
        )

        vocal_key = f'stems/{job_id}/{track_name}_вокал.wav'
        minus_key = f'stems/{job_id}/{track_name}_минус.wav'

        with open(vocal_path, 'rb') as f:
            s3.put_object(Bucket='files', Key=vocal_key, Body=f.read(), ContentType='audio/wav')

        with open(no_vocal_path, 'rb') as f:
            s3.put_object(Bucket='files', Key=minus_key, Body=f.read(), ContentType='audio/wav')

        access_key = os.environ['AWS_ACCESS_KEY_ID']
        cdn_base = f'https://cdn.poehali.dev/projects/{access_key}/bucket'

        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'vocal_url': f'{cdn_base}/{vocal_key}',
                'vocal_filename': f'{track_name}_вокал.wav',
                'minus_url': f'{cdn_base}/{minus_key}',
                'minus_filename': f'{track_name}_минус.wav',
            })
        }
