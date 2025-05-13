import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'currencyConversion'
})
export class CurrencyConversionPipe implements PipeTransform {

  transform(value: number, currencyValue: string): number {
    if(currencyValue === 'USD') {
      return Math.round(value * 129.10);
    }
    return value;
  }

}
